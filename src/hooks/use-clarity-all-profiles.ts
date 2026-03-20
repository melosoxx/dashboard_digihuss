"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import type { ClarityInsights, ClarityDailyDataPoint } from "@/types/clarity";

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export interface ProfileClarityData {
  profileId: string;
  profileName: string;
  profileColor: string;
  data: ClarityInsights | null;
}

export function useClarityAllProfiles() {
  const { dateRange } = useDateRange();
  const { profiles } = useBusinessProfile();
  const queryClient = useQueryClient();

  const [isManualFetching, setIsManualFetching] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const clarityProfiles = profiles.filter(
    (p) => p.isActive && p.configuredServices.includes("clarity")
  );

  const results = useQueries({
    queries: clarityProfiles.map((profile) => ({
      queryKey: [
        "clarity",
        "daily",
        dateRange.startDate,
        dateRange.endDate,
        profile.id,
      ],
      queryFn: async () => {
        const params = new URLSearchParams({
          profileId: profile.id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        const res = await fetch(`/api/clarity/daily?${params}`);
        if (!res.ok)
          throw new Error(`Failed to fetch clarity daily: ${res.status}`);
        return res.json() as Promise<{
          data: ClarityInsights | null;
          daysAvailable: number;
          dailyBreakdown: ClarityDailyDataPoint[];
          dateRange: { start: string; end: string } | null;
          lastFetchedAt: string | null;
        }>;
      },
      staleTime: STALE_TIME,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const isFetching = results.some((r) => r.isFetching);

  const profilesData: ProfileClarityData[] = clarityProfiles.map(
    (profile, i) => ({
      profileId: profile.id,
      profileName: profile.name,
      profileColor: profile.color,
      data: results[i]?.data?.data ?? null,
    })
  );

  // Aggregate daily breakdown across all profiles (sum sessions/users per date)
  const dailyBreakdown = useMemo<ClarityDailyDataPoint[]>(() => {
    const byDate = new Map<string, {
      sessions: number;
      users: number;
      profileBreakdown: Array<{ profileName: string; profileColor: string; sessions: number; users: number }>;
    }>();
    for (let i = 0; i < clarityProfiles.length; i++) {
      const profile = clarityProfiles[i];
      for (const point of results[i]?.data?.dailyBreakdown ?? []) {
        const existing = byDate.get(point.date) ?? { sessions: 0, users: 0, profileBreakdown: [] };
        existing.sessions += point.sessions;
        existing.users += point.users;
        existing.profileBreakdown.push({
          profileName: profile.name,
          profileColor: profile.color,
          sessions: point.sessions,
          users: point.users,
        });
        byDate.set(point.date, existing);
      }
    }
    return Array.from(byDate.entries())
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [results, clarityProfiles]);

  // Aggregate daysAvailable and lastFetchedAt across all profiles
  const daysAvailable = Math.max(
    0,
    ...results.map((r) => r.data?.daysAvailable ?? 0)
  );
  const lastFetchedAt = results.reduce<string | null>((latest, r) => {
    const fetched = r.data?.lastFetchedAt ?? null;
    if (!fetched) return latest;
    if (!latest) return fetched;
    return fetched > latest ? fetched : latest;
  }, null);

  // Fetch today's data for ALL profiles with clarity configured
  const fetchAllToday = useCallback(async () => {
    if (rateLimited || isManualFetching || clarityProfiles.length === 0) return;
    setIsManualFetching(true);
    try {
      for (const profile of clarityProfiles) {
        const params = new URLSearchParams({
          numOfDays: "1",
          profileId: profile.id,
        });
        const res = await fetch(`/api/clarity?${params}`);
        if (!res.ok) {
          if (res.status === 429) {
            setRateLimited(true);
            break;
          }
        }
      }
      // Invalidate all clarity daily queries to reload with fresh data
      queryClient.invalidateQueries({ queryKey: ["clarity", "daily"] });
    } finally {
      setIsManualFetching(false);
    }
  }, [clarityProfiles, rateLimited, isManualFetching, queryClient]);

  return {
    profilesData,
    dailyBreakdown,
    isLoading,
    isFetching,
    daysAvailable,
    lastFetchedAt,
    fetchAllToday,
    isManualFetching,
    rateLimited,
  };
}
