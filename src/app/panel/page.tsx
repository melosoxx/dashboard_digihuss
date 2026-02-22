"use client";

import { useMemo } from "react";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Megaphone,
  TrendingUp,
  Target,
  MousePointerClick,
  Percent,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { SpendVsRevenueChart } from "@/components/roi/spend-vs-revenue";
import { MarketingFunnel } from "@/components/panel/marketing-funnel";
import { ActiveAdsCard } from "@/components/panel/top-campaigns-card";
import { SalesAttribution } from "@/components/panel/sales-attribution";
import { SectionLabel } from "@/components/panel/section-label";
import { IntegrationLogos } from "@/components/panel/integration-logos";
import { useShopifyOrders } from "@/hooks/use-shopify-orders";
import { useShopifyAnalytics } from "@/hooks/use-shopify-analytics";
import { useMetaAccount } from "@/hooks/use-meta-account";
import { useMetaAds } from "@/hooks/use-meta-campaigns";
import { useClarity } from "@/hooks/use-clarity";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function PanelGeneralPage() {
  const shopify = useShopifyOrders();
  const analytics = useShopifyAnalytics();
  const meta = useMetaAccount();
  const activeAds = useMetaAds();
  const clarity = useClarity();
  const isLoadingMain = shopify.isLoading || meta.isLoading;

  const revenue = shopify.data?.totalRevenue ?? 0;
  const orderCount = shopify.data?.orderCount ?? 0;
  const aov = shopify.data?.averageOrderValue ?? 0;
  const adSpend = meta.data?.spend ?? 0;
  const roas = adSpend > 0 ? revenue / adSpend : 0;
  const metaRevenue = meta.data?.purchaseRevenue ?? 0;
  const metaConversions = meta.data?.conversions ?? 0;
  const costPerResult = orderCount > 0 ? adSpend / orderCount : 0;
  const activeAdsList = activeAds.data?.ads ?? [];
  const avgCtr = activeAdsList.length > 0
    ? activeAdsList.reduce((sum, ad) => sum + ad.ctr, 0) / activeAdsList.length
    : 0;
  const netProfit = revenue - adSpend;

  const revenueTrend = analytics.data?.periodComparison;

  const combinedData = useMemo(() => {
    const revenueByDate = new Map<string, number>();
    const spendByDate = new Map<string, number>();

    for (const day of shopify.data?.dailyRevenue ?? []) {
      revenueByDate.set(day.date, day.revenue);
    }
    for (const day of meta.data?.dailyMetrics ?? []) {
      spendByDate.set(day.date, day.spend);
    }

    const allDates = new Set([...revenueByDate.keys(), ...spendByDate.keys()]);
    return Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        revenue: revenueByDate.get(date) ?? 0,
        adSpend: spendByDate.get(date) ?? 0,
      }));
  }, [shopify.data, meta.data]);

  const errorSources = [
    shopify.error && "Shopify",
    meta.error && "Meta Ads",
  ].filter(Boolean);

  return (
    <div>
      <PageHeader
        title="Analytics & Attribution"
        description="Vista ejecutiva en tiempo real del rendimiento de marketing"
        actions={
          <IntegrationLogos
            shopifyStatus={shopify.isLoading ? "loading" : shopify.error ? "error" : "connected"}
            metaStatus={meta.isLoading ? "loading" : meta.error ? "error" : "connected"}
            clarityStatus={
              clarity.isFetching ? "loading"
              : clarity.error ? "error"
              : clarity.data ? "connected"
              : "idle"
            }
          />
        }
      />

      {errorSources.length > 0 && (
        <ErrorDisplay
          message={`Error al cargar datos de: ${errorSources.join(", ")}. Las demas fuentes funcionan correctamente.`}
        />
      )}

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-6">
        <KPICard
          title="Ingresos Totales"
          value={revenue}
          formattedValue={formatCurrency(revenue)}
          icon={DollarSign}
          iconClassName="text-emerald-500"
          isLoading={shopify.isLoading}
          trend={
            revenueTrend
              ? {
                  value: revenueTrend.percentChange,
                  direction:
                    revenueTrend.percentChange > 0
                      ? "up"
                      : revenueTrend.percentChange < 0
                      ? "down"
                      : "neutral",
                  isPositive: revenueTrend.percentChange >= 0,
                }
              : undefined
          }
        />
        <KPICard
          title="Pedidos"
          value={orderCount}
          formattedValue={formatNumber(orderCount)}
          icon={ShoppingCart}
          iconClassName="text-blue-500"
          isLoading={shopify.isLoading}
        />
        <KPICard
          title="Ticket Promedio"
          value={aov}
          formattedValue={formatCurrency(aov)}
          icon={Receipt}
          iconClassName="text-emerald-500"
          isLoading={shopify.isLoading}
        />
        <KPICard
          title="Gasto en Ads"
          value={adSpend}
          formattedValue={formatCurrency(adSpend)}
          icon={Megaphone}
          iconClassName="text-red-500"
          isLoading={meta.isLoading}
        />
        <KPICard
          title="ROAS"
          value={roas}
          formattedValue={`${roas.toFixed(2)}x`}
          icon={TrendingUp}
          iconClassName="text-teal-500"
          isLoading={meta.isLoading}
        />
        <KPICard
          title="Costo x Resultado"
          value={costPerResult}
          formattedValue={formatCurrency(costPerResult)}
          icon={Target}
          iconClassName="text-orange-500"
          isLoading={isLoadingMain}
        />
        <KPICard
          title="CTR Promedio"
          value={avgCtr}
          formattedValue={`${avgCtr.toFixed(2)}%`}
          icon={MousePointerClick}
          iconClassName="text-blue-500"
          isLoading={activeAds.isLoading}
        />
        <KPICard
          title="Ganancia Neta"
          value={netProfit}
          formattedValue={formatCurrency(netProfit)}
          icon={Percent}
          iconClassName={netProfit >= 0 ? "text-emerald-500" : "text-red-500"}
          isLoading={isLoadingMain}
          trend={{
            value: revenue > 0 ? (netProfit / revenue) * 100 : 0,
            direction: netProfit > 0 ? "up" : netProfit < 0 ? "down" : "neutral",
            isPositive: netProfit >= 0,
          }}
        />
      </div>

      {/* Charts + Attribution */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px] mb-6">
        <SpendVsRevenueChart data={combinedData} isLoading={isLoadingMain} />
        <SalesAttribution
          totalRevenue={revenue}
          totalOrders={orderCount}
          metaRevenue={metaRevenue}
          metaConversions={metaConversions}
          isLoading={isLoadingMain}
        />
      </div>

      {/* Active ads table */}
      <div className="mb-6">
        <ActiveAdsCard
          ads={activeAds.data?.ads ?? []}
          isLoading={activeAds.isLoading}
        />
      </div>

      {/* Funnel */}
      <SectionLabel title="Funnel" />
      <div className="mb-6">
        <MarketingFunnel
          impressions={meta.data?.impressions ?? 0}
          clicks={meta.data?.clicks ?? 0}
          landingSessions={analytics.data?.checkoutSessions ?? 0}
          checkouts={analytics.data?.checkoutCount ?? 0}
          orders={orderCount}
          isLoading={isLoadingMain || analytics.isLoading}
        />
      </div>
    </div>
  );
}
