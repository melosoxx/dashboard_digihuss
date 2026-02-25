"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { MetaActiveAd, MetaCampaignInsight, MetaAdsetInsight } from "@/types/meta";

export function useMetaAds() {
  const { dateRange } = useDateRange();
  const { activeProfileId, aggregateMode, selectedProfileIds } =
    useBusinessProfile();

  // --- Individual mode ---
  const singleResult = useQuery<{ ads: MetaActiveAd[] }>({
    queryKey: ["meta", "ads", dateRange.startDate, dateRange.endDate, activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        profileId: activeProfileId,
      });
      const res = await fetch(`/api/meta/ads?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch Meta ads: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    enabled: !aggregateMode,
  });

  // --- Aggregate mode ---
  const multiResults = useQueries({
    queries: (aggregateMode ? selectedProfileIds : []).map((pid) => ({
      queryKey: ["meta", "ads", dateRange.startDate, dateRange.endDate, pid],
      queryFn: async () => {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          profileId: pid,
        });
        const res = await fetch(`/api/meta/ads?${params}`);
        if (!res.ok) throw new Error(`Failed to fetch Meta ads: ${res.status}`);
        return res.json() as Promise<{ ads: MetaActiveAd[] }>;
      },
      staleTime: QUERY_STALE_TIME,
      refetchInterval: QUERY_REFETCH_INTERVAL,
    })),
  });

  if (!aggregateMode) return singleResult;

  // Merge aggregate results
  const isLoading = multiResults.some((r) => r.isLoading);
  const isFetching = multiResults.some((r) => r.isFetching);
  const error = multiResults.find((r) => r.error)?.error ?? null;

  const allAds = multiResults
    .filter((r) => r.data)
    .flatMap((r) => r.data!.ads);

  const data: { ads: MetaActiveAd[] } | undefined =
    allAds.length > 0 ? { ads: allAds } : undefined;

  return { data, isLoading, isFetching, error, isError: !!error };
}

export function useMetaAdsets() {
  const { dateRange } = useDateRange();
  const { activeProfileId } = useBusinessProfile();

  return useQuery<{ adsets: MetaAdsetInsight[] }>({
    queryKey: ["meta", "adsets", dateRange.startDate, dateRange.endDate, activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        profileId: activeProfileId,
      });
      const res = await fetch(`/api/meta/adsets?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch Meta adsets: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
  });
}

export function useMetaCampaigns() {
  const { dateRange } = useDateRange();
  const { activeProfileId } = useBusinessProfile();

  return useQuery<{ campaigns: MetaCampaignInsight[] }>({
    queryKey: ["meta", "campaigns", dateRange.startDate, dateRange.endDate, activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        profileId: activeProfileId,
      });
      const res = await fetch(`/api/meta/campaigns?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch Meta campaigns: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
  });
}
