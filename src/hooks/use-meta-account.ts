"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { MetaAccountInsights, MetaDailyMetric } from "@/types/meta";

export function useMetaAccount() {
  const { dateRange } = useDateRange();
  const { activeProfileId, aggregateMode, selectedProfileIds } =
    useBusinessProfile();

  // --- Individual mode ---
  const singleResult = useQuery<MetaAccountInsights>({
    queryKey: [
      "meta",
      "account",
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
      const res = await fetch(`/api/meta/account?${params}`);
      if (!res.ok)
        throw new Error(`Failed to fetch Meta insights: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    enabled: !aggregateMode,
  });

  // --- Aggregate mode ---
  const multiResults = useQueries({
    queries: (aggregateMode ? selectedProfileIds : []).map((pid) => ({
      queryKey: [
        "meta",
        "account",
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
        const res = await fetch(`/api/meta/account?${params}`);
        if (!res.ok)
          throw new Error(`Failed to fetch Meta insights: ${res.status}`);
        return res.json() as Promise<MetaAccountInsights>;
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
  let data: MetaAccountInsights | undefined;
  if (successful.length > 0) {
    const spend = successful.reduce((s, d) => s + d.spend, 0);
    const impressions = successful.reduce((s, d) => s + d.impressions, 0);
    const clicks = successful.reduce((s, d) => s + d.clicks, 0);
    const conversions = successful.reduce((s, d) => s + d.conversions, 0);
    const purchaseRevenue = successful.reduce(
      (s, d) => s + d.purchaseRevenue,
      0
    );

    data = {
      spend,
      impressions,
      clicks,
      cpc: clicks > 0 ? spend / clicks : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      roas: spend > 0 ? purchaseRevenue / spend : 0,
      conversions,
      purchaseRevenue,
      costPerAcquisition: conversions > 0 ? spend / conversions : 0,
      dailyMetrics: mergeDailyMetrics(successful.map((d) => d.dailyMetrics)),
    };
  }

  return { data, isLoading, isFetching, error, isError: !!error };
}

function mergeDailyMetrics(arrays: MetaDailyMetric[][]): MetaDailyMetric[] {
  const map = new Map<string, MetaDailyMetric>();
  for (const arr of arrays) {
    for (const day of arr) {
      const existing = map.get(day.date) || {
        date: day.date,
        spend: 0,
        impressions: 0,
        clicks: 0,
        roas: 0,
        conversions: 0,
        purchaseRevenue: 0,
      };
      existing.spend += day.spend;
      existing.impressions += day.impressions;
      existing.clicks += day.clicks;
      existing.conversions += day.conversions;
      existing.purchaseRevenue += day.purchaseRevenue;
      existing.roas =
        existing.spend > 0 ? existing.purchaseRevenue / existing.spend : 0;
      map.set(day.date, existing);
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
