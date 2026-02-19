"use client";

import { useQuery } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { MetaAccountInsights } from "@/types/meta";

export function useMetaAccount() {
  const { dateRange } = useDateRange();

  return useQuery<MetaAccountInsights>({
    queryKey: ["meta", "account", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const res = await fetch(`/api/meta/account?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch Meta insights: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
  });
}
