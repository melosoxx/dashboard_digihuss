"use client";

import { useQuery } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { OrderListItem } from "@/types/shopify";

export function useShopifyOrderList() {
  const { dateRange } = useDateRange();
  const { activeProfileId } = useBusinessProfile();

  return useQuery<OrderListItem[]>({
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
  });
}
