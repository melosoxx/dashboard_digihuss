"use client";

import { useQuery } from "@tanstack/react-query";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { ClarityInsights } from "@/types/clarity";

export function useClarity() {
  return useQuery<ClarityInsights>({
    queryKey: ["clarity", "insights"],
    queryFn: async () => {
      const res = await fetch("/api/clarity");
      if (!res.ok) throw new Error(`Failed to fetch Clarity insights: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
  });
}
