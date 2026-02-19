"use client";

import { useQuery } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { TopProduct } from "@/types/shopify";

export function useShopifyProducts() {
  const { dateRange } = useDateRange();

  return useQuery<{ topProducts: TopProduct[] }>({
    queryKey: ["shopify", "products", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const res = await fetch(`/api/shopify/products?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
  });
}
