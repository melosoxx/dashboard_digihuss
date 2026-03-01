"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { MpTransaction } from "@/types/finance";

export function useMpTransactions() {
  const { dateRange } = useDateRange();
  const { activeProfileId, aggregateMode, selectedProfileIds, profiles } =
    useBusinessProfile();

  // --- Individual mode ---
  const singleResult = useQuery<MpTransaction[]>({
    queryKey: [
      "mercadopago",
      "transactions",
      dateRange.startDate,
      dateRange.endDate,
      activeProfileId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        profileId: activeProfileId,
      });
      const res = await fetch(`/api/mercadopago/payments/list?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch MP transactions: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    enabled: !!activeProfileId && !aggregateMode,
  });

  // --- Aggregate mode ---
  const selectedProfiles = profiles.filter((p) =>
    selectedProfileIds.includes(p.id)
  );

  const multiResults = useQueries({
    queries: (aggregateMode ? selectedProfiles : []).map((profile) => ({
      queryKey: [
        "mercadopago",
        "transactions",
        "aggregate",
        dateRange.startDate,
        dateRange.endDate,
        profile.id,
      ],
      queryFn: async () => {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          profileId: profile.id,
        });
        const res = await fetch(`/api/mercadopago/payments/list?${params}`);
        if (!res.ok) throw new Error(`Failed to fetch MP transactions: ${res.status}`);
        const transactions: MpTransaction[] = await res.json();
        return transactions.map((tx) => ({
          ...tx,
          profileName: profile.name,
          profileColor: profile.color,
        }));
      },
      staleTime: QUERY_STALE_TIME,
      refetchInterval: QUERY_REFETCH_INTERVAL,
    })),
  });

  if (!aggregateMode) return singleResult;

  // Merge aggregate results
  const isLoading = multiResults.some((r) => r.isLoading);
  const isFetching = multiResults.some((r) => r.isFetching);
  const error = multiResults.find((r) => r.error)?.error ?? null;

  const allTransactions = multiResults
    .filter((r) => r.data)
    .flatMap((r) => r.data!);

  const data: MpTransaction[] | undefined =
    allTransactions.length > 0
      ? allTransactions.sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      : undefined;

  return { data, isLoading, isFetching, error, isError: !!error };
}
