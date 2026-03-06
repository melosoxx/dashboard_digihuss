"use client";

import { useQueries } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME } from "@/lib/constants";
import type { OrdersAggregate, DailyRevenue, TopProduct } from "@/types/shopify";
import type { MetaAccountInsights, MetaDailyMetric } from "@/types/meta";
import { getEnabledProfileIds } from "@/lib/aggregate-utils";

// --- Shopify Orders Aggregation ---

export function useAggregatedShopifyOrders() {
  const { dateRange } = useDateRange();
  const { aggregateMode, selectedProfileIds, profiles } =
    useBusinessProfile();
  const enabledIds = getEnabledProfileIds(profiles, "shopify", selectedProfileIds);

  const selectedProfiles = profiles.filter((p) =>
    enabledIds.includes(p.id)
  );

  const results = useQueries({
    queries: selectedProfiles.map((profile) => ({
      queryKey: [
        "shopify",
        "orders",
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
        const res = await fetch(`/api/shopify/orders?${params}`);
        if (!res.ok) throw new Error(`Failed to fetch orders: ${res.status}`);
        return res.json() as Promise<OrdersAggregate>;
      },
      staleTime: QUERY_STALE_TIME,
      enabled: aggregateMode && selectedProfiles.length > 0,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error ?? null;

  let data: OrdersAggregate | undefined;
  if (!isLoading && results.length > 0) {
    const successful = results.filter((r) => r.data).map((r) => r.data!);
    if (successful.length > 0) {
      const totalRevenue = successful.reduce(
        (sum, d) => sum + d.totalRevenue,
        0
      );
      const orderCount = successful.reduce(
        (sum, d) => sum + d.orderCount,
        0
      );
      data = {
        totalRevenue,
        orderCount,
        averageOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
        currency: successful[0].currency,
        dailyRevenue: mergeDailyRevenue(successful.map((d) => d.dailyRevenue)),
      };
    }
  }

  return { data, isLoading, error };
}

// --- Shopify Products Aggregation ---

export function useAggregatedShopifyProducts() {
  const { dateRange } = useDateRange();
  const { aggregateMode, selectedProfileIds, profiles } =
    useBusinessProfile();
  const enabledIds = getEnabledProfileIds(profiles, "shopify", selectedProfileIds);

  const selectedProfiles = profiles.filter((p) =>
    enabledIds.includes(p.id)
  );

  const results = useQueries({
    queries: selectedProfiles.map((profile) => ({
      queryKey: [
        "shopify",
        "products",
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
        const res = await fetch(`/api/shopify/products?${params}`);
        if (!res.ok)
          throw new Error(`Failed to fetch products: ${res.status}`);
        return res.json() as Promise<{ topProducts: TopProduct[] }>;
      },
      staleTime: QUERY_STALE_TIME,
      enabled: aggregateMode && selectedProfiles.length > 0,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error ?? null;

  let data: { topProducts: TopProduct[] } | undefined;
  if (!isLoading && results.length > 0) {
    const all = results
      .filter((r) => r.data)
      .flatMap((r) => r.data!.topProducts);
    const merged = mergeProducts(all);
    data = { topProducts: merged };
  }

  return { data, isLoading, error };
}

// --- Meta Account Aggregation ---

export function useAggregatedMetaAccount() {
  const { dateRange } = useDateRange();
  const { aggregateMode, selectedProfileIds, profiles } =
    useBusinessProfile();
  const enabledIds = getEnabledProfileIds(profiles, "meta", selectedProfileIds);

  const selectedProfiles = profiles.filter((p) =>
    enabledIds.includes(p.id)
  );

  const results = useQueries({
    queries: selectedProfiles.map((profile) => ({
      queryKey: [
        "meta",
        "account",
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
        const res = await fetch(`/api/meta/account?${params}`);
        if (!res.ok)
          throw new Error(`Failed to fetch Meta insights: ${res.status}`);
        return res.json() as Promise<MetaAccountInsights>;
      },
      staleTime: QUERY_STALE_TIME,
      enabled: aggregateMode && selectedProfiles.length > 0,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error ?? null;

  let data: MetaAccountInsights | undefined;
  if (!isLoading && results.length > 0) {
    const successful = results.filter((r) => r.data).map((r) => r.data!);
    if (successful.length > 0) {
      const spend = successful.reduce((s, d) => s + d.spend, 0);
      const impressions = successful.reduce((s, d) => s + d.impressions, 0);
      const clicks = successful.reduce((s, d) => s + d.clicks, 0);
      const conversions = successful.reduce((s, d) => s + d.conversions, 0);
      const purchaseRevenue = successful.reduce(
        (s, d) => s + d.purchaseRevenue,
        0
      );

      data = {
        spend,
        impressions,
        clicks,
        cpc: clicks > 0 ? spend / clicks : 0,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        roas: spend > 0 ? purchaseRevenue / spend : 0,
        conversions,
        purchaseRevenue,
        costPerAcquisition: conversions > 0 ? spend / conversions : 0,
        dailyMetrics: mergeDailyMetrics(
          successful.map((d) => d.dailyMetrics)
        ),
      };
    }
  }

  return { data, isLoading, error };
}

// --- Merge Helpers ---

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

function mergeDailyMetrics(arrays: MetaDailyMetric[][]): MetaDailyMetric[] {
  const map = new Map<string, MetaDailyMetric>();
  for (const arr of arrays) {
    for (const day of arr) {
      const existing = map.get(day.date) || {
        date: day.date,
        spend: 0,
        impressions: 0,
        clicks: 0,
        roas: 0,
        conversions: 0,
        purchaseRevenue: 0,
      };
      existing.spend += day.spend;
      existing.impressions += day.impressions;
      existing.clicks += day.clicks;
      existing.conversions += day.conversions;
      existing.purchaseRevenue += day.purchaseRevenue;
      // Recalculate ROAS for merged day
      existing.roas =
        existing.spend > 0 ? existing.purchaseRevenue / existing.spend : 0;
      map.set(day.date, existing);
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
