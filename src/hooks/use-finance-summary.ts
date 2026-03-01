"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { FinanceSummary, MercadoPagoSummary } from "@/types/finance";

export function useFinanceSummary() {
  const { dateRange } = useDateRange();
  const { activeProfileId, aggregateMode, selectedProfileIds } =
    useBusinessProfile();

  const singleResult = useQuery<FinanceSummary>({
    queryKey: [
      "finance",
      "summary",
      dateRange.startDate,
      dateRange.endDate,
      activeProfileId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        profileId: activeProfileId,
      });
      const res = await fetch(`/api/finance/summary?${params}`);
      if (!res.ok)
        throw new Error(`Failed to fetch finance summary: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    enabled: !aggregateMode,
  });

  const multiResults = useQueries({
    queries: (aggregateMode ? selectedProfileIds : []).map((pid) => ({
      queryKey: [
        "finance",
        "summary",
        dateRange.startDate,
        dateRange.endDate,
        pid,
      ],
      queryFn: async () => {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          profileId: pid,
        });
        const res = await fetch(`/api/finance/summary?${params}`);
        if (!res.ok)
          throw new Error(`Failed to fetch finance summary: ${res.status}`);
        return res.json() as Promise<FinanceSummary>;
      },
      staleTime: QUERY_STALE_TIME,
      refetchInterval: QUERY_REFETCH_INTERVAL,
    })),
  });

  if (!aggregateMode) return singleResult;

  const isLoading = multiResults.some((r) => r.isLoading);
  const isFetching = multiResults.some((r) => r.isFetching);
  const error = multiResults.find((r) => r.error)?.error ?? null;

  const successful = multiResults.filter((r) => r.data).map((r) => r.data!);
  let data: FinanceSummary | undefined;
  if (successful.length > 0) {
    data = mergeFinanceSummaries(successful);
  }

  return { data, isLoading, isFetching, error, isError: !!error };
}

function mergeFinanceSummaries(summaries: FinanceSummary[]): FinanceSummary {
  // Each profile's MP data is already keyword-filtered server-side,
  // so we sum all summaries without deduplication by accountId.
  const mpContributors = new Set<number>(); // indices of profiles with MP data
  let mpNetRevenue = 0;
  let mpFees = 0;
  let mpSummary: MercadoPagoSummary | null = null;

  summaries.forEach((s, idx) => {
    if (s.mpSummary) {
      mpContributors.add(idx);
      mpNetRevenue += s.mpNetRevenue;
      mpFees += s.mpFees;
      mpSummary = mpSummary ?? s.mpSummary;
    }
  });

  const grossRevenue = summaries.reduce((s, d) => s + d.grossRevenue, 0);
  const adSpend = summaries.reduce((s, d) => s + d.adSpend, 0);
  const manualExpenses = summaries.reduce((s, d) => s + d.manualExpenses, 0);
  const recurringExpenses = summaries.reduce(
    (s, d) => s + d.recurringExpenses,
    0
  );
  const totalExpenses = summaries.reduce((s, d) => s + d.totalExpenses, 0);
  const netProfit = mpNetRevenue - totalExpenses;
  const profitMargin = mpNetRevenue > 0 ? (netProfit / mpNetRevenue) * 100 : 0;

  // Merge expenses by category
  const categoryMap = new Map<
    string,
    { name: string; color: string; total: number }
  >();
  for (const s of summaries) {
    for (const cat of s.expensesByCategory) {
      const existing = categoryMap.get(cat.categoryName) ?? {
        name: cat.categoryName,
        color: cat.categoryColor,
        total: 0,
      };
      existing.total += cat.total;
      categoryMap.set(cat.categoryName, existing);
    }
  }

  const expensesByCategory = Array.from(categoryMap.values())
    .map((c) => ({
      categoryName: c.name,
      categoryColor: c.color,
      total: c.total,
      percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Merge daily finance — only add revenue/mpFees from MP-contributor profiles
  const dailyMap = new Map<
    string,
    {
      revenue: number;
      adSpend: number;
      mpFees: number;
      otherExpenses: number;
    }
  >();
  summaries.forEach((s, idx) => {
    const isMpContributor = mpContributors.has(idx);
    for (const day of s.dailyFinance) {
      const existing = dailyMap.get(day.date) ?? {
        revenue: 0,
        adSpend: 0,
        mpFees: 0,
        otherExpenses: 0,
      };
      if (isMpContributor) {
        existing.revenue += day.revenue;
        existing.mpFees += day.mpFees;
      }
      existing.adSpend += day.adSpend;
      existing.otherExpenses += day.otherExpenses;
      dailyMap.set(day.date, existing);
    }
  });

  const dailyFinance = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      ...data,
      netProfit: data.revenue - data.adSpend - data.otherExpenses,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    grossRevenue,
    mpNetRevenue,
    mpFees,
    adSpend,
    manualExpenses,
    recurringExpenses,
    totalExpenses,
    netProfit,
    profitMargin,
    mpSummary,
    expensesByCategory,
    dailyFinance,
  };
}
