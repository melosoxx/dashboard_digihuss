"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import { getEnabledProfileIds } from "@/lib/aggregate-utils";
import type { AnalyticsData } from "@/types/shopify";

export function useShopifyAnalytics() {
  const { dateRange } = useDateRange();
  const { activeProfileId, aggregateMode, selectedProfileIds, profiles } =
    useBusinessProfile();
  const enabledIds = getEnabledProfileIds(profiles, "shopify", selectedProfileIds);

  // --- Individual mode ---
  const singleResult = useQuery<AnalyticsData>({
    queryKey: ["shopify", "analytics", dateRange.startDate, dateRange.endDate, activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        profileId: activeProfileId,
      });
      const res = await fetch(`/api/shopify/analytics?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    enabled: !aggregateMode,
  });

  // --- Aggregate mode ---
  const multiResults = useQueries({
    queries: (aggregateMode ? enabledIds : []).map((pid) => ({
      queryKey: [
        "shopify",
        "analytics",
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
        const res = await fetch(`/api/shopify/analytics?${params}`);
        if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`);
        return res.json() as Promise<AnalyticsData>;
      },
      staleTime: QUERY_STALE_TIME,
      refetchInterval: QUERY_REFETCH_INTERVAL,
    })),
  });

  if (!aggregateMode) return { ...singleResult, profileBreakdown: undefined };

  // Merge aggregate results
  const isLoading = multiResults.some((r) => r.isLoading);
  const isFetching = multiResults.some((r) => r.isFetching);
  const error = multiResults.find((r) => r.error)?.error ?? null;

  const successful = multiResults.filter((r) => r.data).map((r) => r.data!);
  let data: AnalyticsData | undefined;
  if (successful.length > 0) {
    const checkoutSessions = successful.reduce((s, d) => s + d.checkoutSessions, 0);
    const checkoutCount = successful.reduce((s, d) => s + d.checkoutCount, 0);

    const totalOrders = successful.reduce(
      (s, d) => s + d.orderTrend.reduce((os, day) => os + day.count, 0),
      0,
    );
    const conversionRate =
      checkoutSessions > 0 ? (totalOrders / checkoutSessions) * 100 : null;

    const currentRevenue = successful.reduce(
      (s, d) => s + d.periodComparison.currentPeriodRevenue,
      0,
    );
    const previousRevenue = successful.reduce(
      (s, d) => s + d.periodComparison.previousPeriodRevenue,
      0,
    );
    const percentChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    data = {
      conversionRate,
      checkoutSessions,
      checkoutCount,
      revenueTrend: mergeTrend(
        successful.map((d) => d.revenueTrend),
        "revenue",
      ),
      orderTrend: mergeTrend(
        successful.map((d) => d.orderTrend),
        "count",
      ),
      periodComparison: {
        currentPeriodRevenue: currentRevenue,
        previousPeriodRevenue: previousRevenue,
        percentChange,
      },
    };
  }

  const profileBreakdown = enabledIds
    .map((pid, idx) => {
      const d = multiResults[idx]?.data;
      return d ? { profileId: pid, data: d } : null;
    })
    .filter(Boolean) as Array<{ profileId: string; data: AnalyticsData }>;

  return { data, isLoading, isFetching, error, isError: !!error, profileBreakdown };
}

function mergeTrend<K extends string>(
  arrays: Array<Array<{ date: string } & Record<K, number>>>,
  valueKey: K,
): Array<{ date: string } & Record<K, number>> {
  const map = new Map<string, number>();
  for (const arr of arrays) {
    for (const item of arr) {
      map.set(item.date, (map.get(item.date) ?? 0) + item[valueKey]);
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, [valueKey]: value }) as { date: string } & Record<K, number>);
}
