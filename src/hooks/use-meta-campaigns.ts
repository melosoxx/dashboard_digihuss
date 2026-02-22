"use client";

import { useQuery } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { MetaActiveAd, MetaCampaignInsight } from "@/types/meta";

export function useMetaAds() {
  const { dateRange } = useDateRange();
  const { activeProfileId } = useBusinessProfile();

  return useQuery<{ ads: MetaActiveAd[] }>({
    queryKey: ["meta", "ads", dateRange.startDate, dateRange.endDate, activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      if (activeProfileId) params.set("profileId", activeProfileId);
      const res = await fetch(`/api/meta/ads?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch Meta ads: ${res.status}`);
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
      });
      if (activeProfileId) params.set("profileId", activeProfileId);
      const res = await fetch(`/api/meta/campaigns?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch Meta campaigns: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
  });
}
