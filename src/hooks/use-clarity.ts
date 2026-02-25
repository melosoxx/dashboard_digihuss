"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import type { ClarityInsights, ClarityVersion } from "@/types/clarity";

function getNumOfDays(startDate: string, endDate: string): 1 | 2 | 3 {
  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const inclusiveDays = diffDays + 1;
  if (inclusiveDays <= 1) return 1;
  if (inclusiveDays <= 2) return 2;
  return 3;
}

function periodLabel(numOfDays: 1 | 2 | 3): string {
  if (numOfDays === 1) return "Hoy";
  if (numOfDays === 2) return "Hoy y ayer";
  return "Últimos 3 días";
}

/** Build query params for cache endpoint. */
function cacheParams(numOfDays: number, profileId: string, extra?: Record<string, string>) {
  const params = new URLSearchParams({
    numOfDays: String(numOfDays),
    profileId,
  });
  if (extra) {
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
  }
  return params;
}

export function useClarity() {
  const { dateRange } = useDateRange();
  const { activeProfileId } = useBusinessProfile();
  const numOfDays = getNumOfDays(dateRange.startDate, dateRange.endDate);
  const queryClient = useQueryClient();
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  // Version state
  const [versions, setVersions] = useState<ClarityVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Load versions list (all versions, independent of selected period)
  const loadVersionsList = useCallback(async () => {
    try {
      const params = new URLSearchParams({ action: "list" });
      if (activeProfileId) params.set("profileId", activeProfileId);
      const res = await fetch(`/api/clarity/cache?${params}`);
      if (!res.ok) return;
      const result: { versions: ClarityVersion[] } = await res.json();
      setVersions(result.versions ?? []);
    } catch (err) {
      console.error("Error loading versions list:", err);
    }
  }, [activeProfileId]);

  // Load cached data from server (latest or specific version)
  const loadCacheFromServer = useCallback(
    async (signal?: AbortSignal, versionId?: string) => {
      setIsLoadingCache(true);
      try {
        const params = cacheParams(numOfDays, activeProfileId);
        if (versionId) params.set("versionId", versionId);

        const res = await fetch(`/api/clarity/cache?${params}`, { signal });
        if (!res.ok) return;

        const result: {
          cached: ClarityInsights | null;
          fetchedAt?: string;
          versionId?: string;
        } = await res.json();

        if (result.cached) {
          queryClient.setQueryData(
            ["clarity", "insights", numOfDays, activeProfileId],
            result.cached
          );
          setFetchedAt(result.fetchedAt ?? null);
          setSelectedVersionId(result.versionId ?? null);
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

  // Select a specific version
  const selectVersion = useCallback((versionId: string) => {
    setSelectedVersionId(versionId);
  }, []);

  // Auto-load cached data + versions list on mount / dependency change
  useEffect(() => {
    setFetchedAt(null);
    setSelectedVersionId(null);
    setVersions([]);
    setRateLimited(false);
    const controller = new AbortController();
    loadCacheFromServer(controller.signal);
    loadVersionsList();

    return () => controller.abort();
  }, [activeProfileId, numOfDays, loadCacheFromServer, loadVersionsList]);

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

  // Manual: load cached data from DB (loads selected version or latest)
  const loadCache = useCallback(async () => {
    await loadCacheFromServer(undefined, selectedVersionId ?? undefined);
    await loadVersionsList();
  }, [loadCacheFromServer, loadVersionsList, selectedVersionId]);

  // Manual: fetch fresh data from Clarity API
  const fetchClarity = useCallback(async () => {
    if (rateLimited) return;
    const result = await query.refetch();
    if (result.isSuccess) {
      setFetchedAt(new Date().toISOString());
      setRateLimited(false);
      await loadVersionsList();
    }
    if (result.isError) {
      const status = (result.error as Error & { status?: number }).status;
      if (status === 429) {
        setRateLimited(true);
      }
    }
  }, [rateLimited, query, loadVersionsList]);

  return {
    ...query,
    fetchClarity,
    loadCache,
    isLoadingCache,
    fetchedAt,
    numOfDays,
    periodLabel: periodLabel(numOfDays),
    rateLimited,
    cacheLoaded,
    // Version-related
    versions,
    selectedVersionId,
    selectVersion,
  };
}
