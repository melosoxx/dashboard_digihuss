"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useClarityQuota } from "@/hooks/use-clarity-quota";
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
  const quota = useClarityQuota();

  const query = useQuery<ClarityInsights>({
    queryKey: ["clarity", "insights", numOfDays, activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams({ numOfDays: String(numOfDays) });
      const res = await fetch(`/api/clarity?${params}`, {
        headers: getCredentialHeaders(),
      });
      if (!res.ok) {
        if (res.status === 429) {
          quota.recordRateLimit();
        }
        const err = new Error(`Failed to fetch Clarity insights: ${res.status}`);
        (err as Error & { status: number }).status = res.status;
        throw err;
      }
      quota.recordSuccess();
      return res.json();
    },
    enabled: false,
    staleTime: Infinity,
    retry: (failureCount, error) => {
      if ((error as Error & { status?: number }).status === 429) return false;
      return failureCount < 1;
    },
  });

  const fetchClarity = useCallback(async () => {
    if (quota.exhausted) return;
    await query.refetch();
  }, [quota.exhausted, query]);

  return {
    ...query,
    fetchClarity,
    quota,
  };
}
