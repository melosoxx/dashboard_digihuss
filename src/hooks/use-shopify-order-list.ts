"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { OrderListItem } from "@/types/shopify";
import { getEnabledProfileIds } from "@/lib/aggregate-utils";

export function useShopifyOrderList() {
  const { dateRange } = useDateRange();
  const { activeProfileId, aggregateMode, selectedProfileIds, profiles } =
    useBusinessProfile();
  const enabledIds = getEnabledProfileIds(profiles, "shopify", selectedProfileIds);

  // --- Individual mode ---
  const singleResult = useQuery<OrderListItem[]>({
    queryKey: [
      "shopify",
      "orders-list",
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
      const res = await fetch(`/api/shopify/orders/list?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch orders list: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    enabled: !aggregateMode,
  });

  // --- Aggregate mode ---
  const selectedProfiles = profiles.filter((p) =>
    enabledIds.includes(p.id)
  );

  const multiResults = useQueries({
    queries: (aggregateMode ? selectedProfiles : []).map((profile) => ({
      queryKey: [
        "shopify",
        "orders-list",
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
        const res = await fetch(`/api/shopify/orders/list?${params}`);
        if (!res.ok) throw new Error(`Failed to fetch orders list: ${res.status}`);
        const orders: OrderListItem[] = await res.json();
        return orders.map((order) => ({
          ...order,
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

  const allOrders = multiResults
    .filter((r) => r.data)
    .flatMap((r) => r.data!);

  const data: OrderListItem[] | undefined =
    allOrders.length > 0
      ? allOrders.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      : undefined;

  return { data, isLoading, isFetching, error, isError: !!error };
}
