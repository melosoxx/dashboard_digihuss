"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { OrdersAggregate, DailyRevenue } from "@/types/shopify";
import { getEnabledProfileIds } from "@/lib/aggregate-utils";

export function useShopifyOrders() {
  const { dateRange } = useDateRange();
  const { activeProfileId, aggregateMode, selectedProfileIds, profiles } =
    useBusinessProfile();
  const enabledIds = getEnabledProfileIds(profiles, "shopify", selectedProfileIds);

  // --- Individual mode ---
  const singleResult = useQuery<OrdersAggregate>({
    queryKey: [
      "shopify",
      "orders",
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
      const res = await fetch(`/api/shopify/orders?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
    enabled: !aggregateMode,
  });

  // --- Aggregate mode ---
  const multiResults = useQueries({
    queries: (aggregateMode ? enabledIds : []).map((pid) => ({
      queryKey: [
        "shopify",
        "orders",
        dateRange.startDate,
        dateRange.endDate,
        pid,
      ],
      queryFn: async () => {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          profileId: pid,
        });
        const res = await fetch(`/api/shopify/orders?${params}`);
        if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
        return res.json() as Promise<OrdersAggregate>;
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

  const successful = multiResults.filter((r) => r.data).map((r) => r.data!);
  let data: OrdersAggregate | undefined;
  if (successful.length > 0) {
    const totalRevenue = successful.reduce((s, d) => s + d.totalRevenue, 0);
    const orderCount = successful.reduce((s, d) => s + d.orderCount, 0);
    data = {
      totalRevenue,
      orderCount,
      averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
      currency: successful[0].currency,
      dailyRevenue: mergeDailyRevenue(successful.map((d) => d.dailyRevenue)),
    };
  }

  return { data, isLoading, isFetching, error, isError: !!error };
}

function mergeDailyRevenue(arrays: DailyRevenue[][]): DailyRevenue[] {
  const map = new Map<string, DailyRevenue>();
  for (const arr of arrays) {
    for (const day of arr) {
      const existing = map.get(day.date) || {
        date: day.date,
        revenue: 0,
        orders: 0,
      };
      existing.revenue += day.revenue;
      existing.orders += day.orders;
      map.set(day.date, existing);
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
