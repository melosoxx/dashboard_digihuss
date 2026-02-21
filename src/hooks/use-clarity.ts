"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useClarityQuota } from "@/hooks/use-clarity-quota";
import type { ClarityInsights } from "@/types/clarity";

function getNumOfDays(startDate: string, endDate: string): 1 | 2 | 3 {
  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const inclusiveDays = diffDays + 1; // count both start and end day
  if (inclusiveDays <= 1) return 1;
  if (inclusiveDays <= 2) return 2;
  return 3;
}

function periodLabel(numOfDays: 1 | 2 | 3): string {
  if (numOfDays === 1) return "Hoy";
  if (numOfDays === 2) return "Hoy y ayer";
  return "Últimos 3 días";
}

export function useClarity() {
  const { dateRange } = useDateRange();
  const { activeProfileId } = useBusinessProfile();
  const numOfDays = getNumOfDays(dateRange.startDate, dateRange.endDate);
  const quota = useClarityQuota();
  const queryClient = useQueryClient();
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(false);

  // Load cached data from server
  const loadCacheFromServer = useCallback(
    async (signal?: AbortSignal) => {
      if (!activeProfileId) return;

      setIsLoadingCache(true);
      try {
        const params = new URLSearchParams({
          profileId: activeProfileId,
          numOfDays: String(numOfDays),
        });

        const res = await fetch(`/api/clarity/cache?${params}`, { signal });
        if (!res.ok) return;

        const result: { cached: ClarityInsights | null; fetchedAt?: string } =
          await res.json();

        if (result.cached) {
          queryClient.setQueryData(
            ["clarity", "insights", numOfDays, activeProfileId],
            result.cached
          );
          setFetchedAt(result.fetchedAt ?? null);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error loading Clarity cache:", err);
        }
      } finally {
        setIsLoadingCache(false);
        setCacheLoaded(true);
      }
    },
    [activeProfileId, numOfDays, queryClient]
  );

  // Auto-load cached data on mount and when dependencies change
  useEffect(() => {
    if (!activeProfileId) {
      setCacheLoaded(true);
      return;
    }

    setFetchedAt(null);
    const controller = new AbortController();
    loadCacheFromServer(controller.signal);

    return () => controller.abort();
  }, [activeProfileId, numOfDays, loadCacheFromServer]);

  const query = useQuery<ClarityInsights>({
    queryKey: ["clarity", "insights", numOfDays, activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams({ numOfDays: String(numOfDays) });
      if (activeProfileId) params.set("profileId", activeProfileId);
      const res = await fetch(`/api/clarity?${params}`);
      if (!res.ok) {
        const err = new Error(`Failed to fetch Clarity insights: ${res.status}`);
        (err as Error & { status: number }).status = res.status;
        throw err;
      }
      return res.json();
    },
    enabled: false,
    staleTime: Infinity,
    retry: (failureCount, error) => {
      if ((error as Error & { status?: number }).status === 429) return false;
      return failureCount < 1;
    },
  });

  // Manual: load cached data from DB (no API call consumed)
  const loadCache = useCallback(async () => {
    await loadCacheFromServer();
  }, [loadCacheFromServer]);

  // Manual: fetch fresh data from Clarity API (consumes 1 call)
  const fetchClarity = useCallback(async () => {
    if (quota.exhausted) return;
    const result = await query.refetch();
    // Always refresh quota after a fetch attempt so the UI reflects reality
    quota.invalidateQuota();
    if (result.isSuccess) {
      setFetchedAt(new Date().toISOString());
    }
  }, [quota, query]);

  return {
    ...query,
    fetchClarity,
    loadCache,
    isLoadingCache,
    fetchedAt,
    numOfDays,
    periodLabel: periodLabel(numOfDays),
    quota,
    cacheLoaded,
  };
}
