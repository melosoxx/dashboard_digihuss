"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { MetaAccountInsights, MetaActiveAd } from "@/types/meta";
import { getEnabledProfileIds } from "@/lib/aggregate-utils";

interface PromotionsResponse {
  configured: boolean;
  promotionsAdAccountId?: string;
  insights: MetaAccountInsights;
  ads: MetaActiveAd[];
}

export function useMetaPromotions() {
  const { dateRange } = useDateRange();
  const { activeProfileId, aggregateMode, selectedProfileIds, profiles } =
    useBusinessProfile();
  const enabledIds = getEnabledProfileIds(profiles, "meta", selectedProfileIds);

  // --- Individual mode ---
  const singleResult = useQuery<PromotionsResponse>({
    queryKey: [
      "meta",
      "promotions",
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
      const res = await fetch(`/api/meta/promotions?${params}`);
      if (!res.ok)
        throw new Error(`Failed to fetch promotions: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    enabled: !aggregateMode,
  });

  // --- Aggregate mode ---
  // Fetch for all enabled profiles with aggregate=true (no domain filtering)
  const multiResults = useQueries({
    queries: (aggregateMode ? enabledIds : []).map((pid) => ({
      queryKey: [
        "meta",
        "promotions",
        dateRange.startDate,
        dateRange.endDate,
        pid,
        "aggregate",
      ],
      queryFn: async () => {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          profileId: pid,
          aggregate: "true",
        });
        const res = await fetch(`/api/meta/promotions?${params}`);
        if (!res.ok)
          throw new Error(`Failed to fetch promotions: ${res.status}`);
        return res.json() as Promise<PromotionsResponse>;
      },
      staleTime: QUERY_STALE_TIME,
      refetchInterval: QUERY_REFETCH_INTERVAL,
    })),
  });

  // Deduplicate: if multiple profiles share the same promotionsAdAccountId,
  // keep only the first result for that account.
  const deduplicatedData = useMemo(() => {
    if (!aggregateMode) return undefined;
    const seen = new Set<string>();
    const unique: PromotionsResponse[] = [];
    for (const r of multiResults) {
      if (!r.data || !r.data.configured) continue;
      const acctId = r.data.promotionsAdAccountId;
      if (acctId && seen.has(acctId)) continue;
      if (acctId) seen.add(acctId);
      unique.push(r.data);
    }
    return unique;
  }, [aggregateMode, multiResults]);

  if (!aggregateMode) {
    const configured = singleResult.data?.configured ?? false;
    return {
      data: configured ? singleResult.data?.insights : undefined,
      ads: configured ? (singleResult.data?.ads ?? []) : [],
      configured,
      isLoading: singleResult.isLoading,
      isFetching: singleResult.isFetching,
      error: singleResult.error,
      isError: singleResult.isError,
    };
  }

  // Aggregate deduplicated results
  const isLoading = multiResults.some((r) => r.isLoading);
  const isFetching = multiResults.some((r) => r.isFetching);
  const error = multiResults.find((r) => r.error)?.error ?? null;
  const configured = (deduplicatedData?.length ?? 0) > 0;

  let data: MetaAccountInsights | undefined;
  let ads: MetaActiveAd[] = [];

  if (deduplicatedData && deduplicatedData.length > 0) {
    const spend = deduplicatedData.reduce((s, d) => s + d.insights.spend, 0);
    const impressions = deduplicatedData.reduce(
      (s, d) => s + d.insights.impressions,
      0
    );
    const clicks = deduplicatedData.reduce(
      (s, d) => s + d.insights.clicks,
      0
    );
    const conversions = deduplicatedData.reduce(
      (s, d) => s + d.insights.conversions,
      0
    );
    const purchaseRevenue = deduplicatedData.reduce(
      (s, d) => s + d.insights.purchaseRevenue,
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
      dailyMetrics: [],
    };

    // Merge all ads from deduplicated results
    ads = deduplicatedData.flatMap((d) => d.ads);
  }

  return { data, ads, configured, isLoading, isFetching, error, isError: !!error };
}
