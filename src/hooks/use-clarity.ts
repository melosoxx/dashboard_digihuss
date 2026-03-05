"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import type { ClarityInsights } from "@/types/clarity";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useClarity() {
  const { dateRange } = useDateRange();
  const { activeProfileId } = useBusinessProfile();
  const queryClient = useQueryClient();

  const [isManualFetching, setIsManualFetching] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  // Primary query: load aggregated daily data for the selected date range
  const query = useQuery<{
    data: ClarityInsights | null;
    daysAvailable: number;
    dateRange: { start: string; end: string } | null;
    lastFetchedAt: string | null;
  }>({
    queryKey: [
      "clarity",
      "daily",
      dateRange.startDate,
      dateRange.endDate,
      activeProfileId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        profileId: activeProfileId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const res = await fetch(`/api/clarity/daily?${params}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch clarity daily: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!activeProfileId,
    staleTime: STALE_TIME,
  });

  // Manual fetch: calls Clarity API for today, saves to daily table, then re-queries
  const fetchToday = useCallback(async () => {
    if (rateLimited || isManualFetching || !activeProfileId) return;
    setIsManualFetching(true);
    try {
      const params = new URLSearchParams({
        numOfDays: "1",
        profileId: activeProfileId,
      });
      const res = await fetch(`/api/clarity?${params}`);
      if (!res.ok) {
        if (res.status === 429) setRateLimited(true);
        return;
      }
      // Invalidate daily query to reload with fresh data
      queryClient.invalidateQueries({ queryKey: ["clarity", "daily"] });
    } finally {
      setIsManualFetching(false);
    }
  }, [activeProfileId, rateLimited, isManualFetching, queryClient]);

  return {
    data: query.data?.data ?? undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    daysAvailable: query.data?.daysAvailable ?? 0,
    lastFetchedAt: query.data?.lastFetchedAt ?? null,
    fetchToday,
    isManualFetching,
    rateLimited,
  };
}
