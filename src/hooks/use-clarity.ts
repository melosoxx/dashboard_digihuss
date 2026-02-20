"use client";

import { useQuery } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { ClarityInsights } from "@/types/clarity";

function getNumOfDays(startDate: string, endDate: string): 1 | 2 | 3 {
  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 1) return 1;
  if (days <= 2) return 2;
  return 3;
}

export function useClarity() {
  const { dateRange } = useDateRange();
  const { activeProfileId, getCredentialHeaders } = useBusinessProfile();
  const numOfDays = getNumOfDays(dateRange.startDate, dateRange.endDate);

  return useQuery<ClarityInsights>({
    queryKey: ["clarity", "insights", numOfDays, activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams({ numOfDays: String(numOfDays) });
      const res = await fetch(`/api/clarity?${params}`, {
        headers: getCredentialHeaders(),
      });
      if (!res.ok) {
        const err = new Error(`Failed to fetch Clarity insights: ${res.status}`);
        (err as Error & { status: number }).status = res.status;
        throw err;
      }
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    retry: (failureCount, error) => {
      if ((error as Error & { status?: number }).status === 429) return false;
      return failureCount < 1;
    },
  });
}
