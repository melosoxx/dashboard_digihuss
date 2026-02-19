"use client";

import { useQuery } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { MetaCampaignInsight } from "@/types/meta";

export function useMetaCampaigns() {
  const { dateRange } = useDateRange();

  return useQuery<{ campaigns: MetaCampaignInsight[] }>({
    queryKey: ["meta", "campaigns", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const res = await fetch(`/api/meta/campaigns?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch Meta campaigns: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
  });
}
