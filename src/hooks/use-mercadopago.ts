"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { MercadoPagoSummary } from "@/types/finance";

export function useMercadoPago() {
  const { dateRange } = useDateRange();
  const { activeProfileId, aggregateMode, selectedProfileIds } =
    useBusinessProfile();

  const singleResult = useQuery<MercadoPagoSummary>({
    queryKey: [
      "mercadopago",
      "payments",
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
      const res = await fetch(`/api/mercadopago/payments?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch MP payments: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    enabled: !aggregateMode,
  });

  const multiResults = useQueries({
    queries: (aggregateMode ? selectedProfileIds : []).map((pid) => ({
      queryKey: [
        "mercadopago",
        "payments",
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
        const res = await fetch(`/api/mercadopago/payments?${params}`);
        if (!res.ok) throw new Error(`Failed to fetch MP payments: ${res.status}`);
        return res.json() as Promise<MercadoPagoSummary>;
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
  let data: MercadoPagoSummary | undefined;
  if (successful.length > 0) {
    data = mergeMercadoPagoSummaries(successful);
  }

  return { data, isLoading, isFetching, error, isError: !!error };
}

function mergeMercadoPagoSummaries(
  summaries: MercadoPagoSummary[]
): MercadoPagoSummary {
  // Each profile's data is already keyword-filtered server-side,
  // so we sum all summaries without deduplication by accountId.
  const grossAmount = summaries.reduce((s, d) => s + d.grossAmount, 0);
  const netAmount = summaries.reduce((s, d) => s + d.netAmount, 0);
  const totalFees = summaries.reduce((s, d) => s + d.totalFees, 0);
  const paymentCount = summaries.reduce((s, d) => s + d.paymentCount, 0);

  // Merge fees by type
  const feesByTypeMap = new Map<string, number>();
  for (const s of summaries) {
    for (const f of s.feesByType) {
      feesByTypeMap.set(f.type, (feesByTypeMap.get(f.type) ?? 0) + f.amount);
    }
  }

  // Merge by payment type
  const byTypeMap = new Map<
    string,
    { label: string; count: number; gross: number; net: number; fees: number }
  >();
  for (const s of summaries) {
    for (const pt of s.byPaymentType) {
      const existing = byTypeMap.get(pt.type) ?? {
        label: pt.label,
        count: 0,
        gross: 0,
        net: 0,
        fees: 0,
      };
      existing.count += pt.count;
      existing.gross += pt.gross;
      existing.net += pt.net;
      existing.fees += pt.fees;
      byTypeMap.set(pt.type, existing);
    }
  }

  // Merge daily
  const dailyMap = new Map<string, { gross: number; net: number; fees: number }>();
  for (const s of summaries) {
    for (const day of s.dailyPayments) {
      const existing = dailyMap.get(day.date) ?? { gross: 0, net: 0, fees: 0 };
      existing.gross += day.gross;
      existing.net += day.net;
      existing.fees += day.fees;
      dailyMap.set(day.date, existing);
    }
  }

  return {
    accountId: summaries[0]?.accountId ?? 0,
    grossAmount,
    netAmount,
    totalFees,
    feesByType: Array.from(feesByTypeMap.entries()).map(([type, amount]) => ({
      type,
      amount,
    })),
    paymentCount,
    avgFeePercent: grossAmount > 0 ? (totalFees / grossAmount) * 100 : 0,
    byPaymentType: Array.from(byTypeMap.entries())
      .map(([type, data]) => ({ type, ...data }))
      .sort((a, b) => b.gross - a.gross),
    dailyPayments: Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}
