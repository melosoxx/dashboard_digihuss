"use client";

import { useQuery } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/constants";
import type { OrdersAggregate } from "@/types/shopify";

export function useShopifyOrders() {
  const { dateRange } = useDateRange();
  const { activeProfileId, getCredentialHeaders } = useBusinessProfile();

  return useQuery<OrdersAggregate>({
    queryKey: ["shopify", "orders", dateRange.startDate, dateRange.endDate, activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const res = await fetch(`/api/shopify/orders?${params}`, {
        headers: getCredentialHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
    refetchInterval: QUERY_REFETCH_INTERVAL,
  });
}
