"use client";

import { useQuery, useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { TopProduct } from "@/types/shopify";
import { getEnabledProfileIds } from "@/lib/aggregate-utils";

export function useShopifyProducts() {
  const { dateRange } = useDateRange();
  const { activeProfileId, aggregateMode, selectedProfileIds, profiles } =
    useBusinessProfile();
  const enabledIds = getEnabledProfileIds(profiles, "shopify", selectedProfileIds);

  // --- Individual mode ---
  const singleResult = useQuery<{ topProducts: TopProduct[] }>({
    queryKey: [
      "shopify",
      "products",
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
      const res = await fetch(`/api/shopify/products?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
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
        "products",
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
        const res = await fetch(`/api/shopify/products?${params}`);
        if (!res.ok)
          throw new Error(`Failed to fetch products: ${res.status}`);
        return res.json() as Promise<{ topProducts: TopProduct[] }>;
      },
      staleTime: QUERY_STALE_TIME,
      refetchInterval: QUERY_REFETCH_INTERVAL,
    })),
  });

  if (!aggregateMode) return singleResult;

  const isLoading = multiResults.some((r) => r.isLoading);
  const isFetching = multiResults.some((r) => r.isFetching);
  const error = multiResults.find((r) => r.error)?.error ?? null;

  const all = multiResults
    .filter((r) => r.data)
    .flatMap((r) => r.data!.topProducts);

  let data: { topProducts: TopProduct[] } | undefined;
  if (all.length > 0) {
    data = { topProducts: mergeProducts(all) };
  }

  return { data, isLoading, isFetching, error, isError: !!error };
}

function mergeProducts(products: TopProduct[]): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const p of products) {
    const existing = map.get(p.title) || {
      title: p.title,
      totalRevenue: 0,
      totalQuantitySold: 0,
      orderCount: 0,
    };
    existing.totalRevenue += p.totalRevenue;
    existing.totalQuantitySold += p.totalQuantitySold;
    existing.orderCount += p.orderCount;
    map.set(p.title, existing);
  }
  return Array.from(map.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);
}
