"use client";

import { useMemo } from "react";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Megaphone,
  TrendingUp,
  Target,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { RoasDailyChart } from "@/components/panel/roas-daily-chart";
import { ConversionsDailyChart } from "@/components/panel/conversions-daily-chart";
import { MarketingFunnel } from "@/components/panel/marketing-funnel";
import { CampaignPerformanceCard } from "@/components/panel/campaign-performance-card";
import { RecentOrdersCard } from "@/components/panel/recent-orders-card";
import { SalesAttribution } from "@/components/panel/sales-attribution";
import { SectionLabel } from "@/components/panel/section-label";
import { useShopifyOrders } from "@/hooks/use-shopify-orders";
import { useShopifyOrderList } from "@/hooks/use-shopify-order-list";
import { useShopifyAnalytics } from "@/hooks/use-shopify-analytics";
import { useMetaAccount } from "@/hooks/use-meta-account";
import { useMetaCampaigns } from "@/hooks/use-meta-campaigns";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useDateRange } from "@/providers/date-range-provider";
import { formatNumber } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { Card, CardContent } from "@/components/ui/card";

function formatDateShort(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PanelGeneralPage() {
  const { formatMoney } = useCurrency();
  const { aggregateMode, profiles, selectedProfileIds } = useBusinessProfile();
  const { dateRange } = useDateRange();
  const shopify = useShopifyOrders();
  const orderList = useShopifyOrderList();
  const analytics = useShopifyAnalytics();
  const meta = useMetaAccount();
  const campaignsQuery = useMetaCampaigns();
  const isLoadingMain = shopify.isLoading || meta.isLoading;

  const revenue = shopify.data?.totalRevenue ?? 0;
  const orderCount = shopify.data?.orderCount ?? 0;
  const aov = shopify.data?.averageOrderValue ?? 0;
  const adSpend = meta.data?.spend ?? 0;
  const roas = adSpend > 0 ? revenue / adSpend : 0;
  const metaRevenue = meta.data?.purchaseRevenue ?? 0;
  const metaConversions = meta.data?.conversions ?? 0;
  const costPerResult = orderCount > 0 ? adSpend / orderCount : 0;
  const netProfit = revenue - adSpend;

  const revenueTrend = analytics.data?.periodComparison;

  // Header date range label
  const dateLabel = `${formatDateShort(dateRange.startDate)} — ${formatDateShort(dateRange.endDate)}`;
  const profileCount = aggregateMode ? (selectedProfileIds?.length ?? profiles.length) : 1;

  // Day count for daily averages
  const dayCount = useMemo(() => {
    const start = new Date(dateRange.startDate + "T00:00:00");
    const end = new Date(dateRange.endDate + "T00:00:00");
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  }, [dateRange.startDate, dateRange.endDate]);

  // Computed insights
  const insights = useMemo(() => {
    const list: { type: "warning" | "success" | "info"; message: string }[] = [];

    if (!isLoadingMain) {
      // ROAS overall status
      if (roas > 0 && roas < 2) {
        list.push({ type: "warning", message: `ROAS actual (${roas.toFixed(2)}x) está por debajo del mínimo recomendado de 2x` });
      } else if (roas >= 2 && roas < 4) {
        list.push({ type: "info", message: `ROAS de ${roas.toFixed(2)}x — rentable, pero con margen de mejora` });
      } else if (roas >= 4) {
        list.push({ type: "success", message: `ROAS de ${roas.toFixed(2)}x — excelente rendimiento de campañas` });
      }

      // Revenue trend vs previous period
      if (revenueTrend && revenueTrend.percentChange !== 0) {
        const dir = revenueTrend.percentChange > 0 ? "subieron" : "bajaron";
        list.push({
          type: revenueTrend.percentChange > 0 ? "success" : "warning",
          message: `Ingresos ${dir} un ${Math.abs(revenueTrend.percentChange).toFixed(1)}% respecto al periodo anterior`,
        });
      }

      // Best day
      const bestDay = shopify.data?.dailyRevenue?.reduce(
        (best, d) => (d.revenue > (best?.revenue ?? 0) ? d : best),
        null as null | { date: string; revenue: number; orders: number }
      );
      if (bestDay && bestDay.revenue > 0) {
        const label = new Date(bestDay.date + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
        list.push({ type: "success", message: `Mejor día del periodo: ${label} con ${formatMoney(bestDay.revenue)} en ingresos` });
      }

      // Best campaign by ROAS
      const campaigns = campaignsQuery.data?.campaigns ?? [];
      if (campaigns.length > 0) {
        const best = campaigns.reduce((b, c) => (c.roas > b.roas ? c : b), campaigns[0]);
        if (best.roas > 0) {
          list.push({ type: "info", message: `Mejor campaña: "${best.campaignName}" con ROAS ${best.roas.toFixed(2)}x` });
        }
      }

      // Cost per result
      if (costPerResult > 0) {
        list.push({ type: "info", message: `Costo por resultado promedio: ${formatMoney(costPerResult)} por pedido` });
      }

      // Meta CTR
      const impressions = meta.data?.impressions ?? 0;
      const clicks = meta.data?.clicks ?? 0;
      if (impressions > 0 && clicks > 0) {
        const ctr = (clicks / impressions) * 100;
        const ctrType = ctr >= 2 ? "success" : ctr >= 1 ? "info" : "warning";
        list.push({ type: ctrType, message: `CTR de campañas Meta: ${ctr.toFixed(2)}% (${formatNumber(clicks)} clics de ${formatNumber(impressions)} impresiones)` });
      }
    }

    return list.slice(0, 6);
  }, [isLoadingMain, roas, revenueTrend, shopify.data, campaignsQuery.data, meta.data, costPerResult, formatMoney]);

  const combinedData = useMemo(() => {
    const normalizeDate = (dateStr: string): string => {
      if (!dateStr) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toISOString().split("T")[0];
    };

    const revenueByDate = new Map<string, number>();
    const ordersByDate = new Map<string, number>();
    const spendByDate = new Map<string, number>();

    for (const day of shopify.data?.dailyRevenue ?? []) {
      const normalizedDate = normalizeDate(day.date);
      revenueByDate.set(normalizedDate, day.revenue);
      ordersByDate.set(normalizedDate, (ordersByDate.get(normalizedDate) ?? 0) + (day.orders ?? 0));
    }
    for (const day of meta.data?.dailyMetrics ?? []) {
      const normalizedDate = normalizeDate(day.date);
      const existing = spendByDate.get(normalizedDate) || 0;
      spendByDate.set(normalizedDate, existing + day.spend);
    }

    const allDates = new Set([...revenueByDate.keys(), ...spendByDate.keys()]);
    return Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        revenue: revenueByDate.get(date) ?? 0,
        adSpend: spendByDate.get(date) ?? 0,
        orders: ordersByDate.get(date) ?? 0,
      }));
  }, [shopify.data, meta.data]);

  const funnelBreakdown = useMemo(() => {
    if (!aggregateMode) return undefined;
    const shopifyBk = shopify.profileBreakdown;
    const analyticsBk = analytics.profileBreakdown;
    const metaBk = meta.profileBreakdown;
    if (!shopifyBk?.length && !analyticsBk?.length && !metaBk?.length) return undefined;

    const profileIds = new Set([
      ...(shopifyBk ?? []).map((b) => b.profileId),
      ...(analyticsBk ?? []).map((b) => b.profileId),
      ...(metaBk ?? []).map((b) => b.profileId),
    ]);

    return Array.from(profileIds).map((pid) => {
      const profile = profiles.find((p) => p.id === pid);
      const s = shopifyBk?.find((b) => b.profileId === pid)?.data;
      const a = analyticsBk?.find((b) => b.profileId === pid)?.data;
      const m = metaBk?.find((b) => b.profileId === pid)?.data;
      return {
        profileName: profile?.name ?? pid,
        profileColor: profile?.color ?? "#888",
        impressions: m?.impressions ?? 0,
        clicks: m?.clicks ?? 0,
        landingSessions: a?.checkoutSessions ?? 0,
        checkouts: a?.checkoutCount ?? 0,
        orders: s?.orderCount ?? 0,
      };
    });
  }, [aggregateMode, profiles, shopify.profileBreakdown, analytics.profileBreakdown, meta.profileBreakdown]);

  const errorSources = [
    shopify.error && "Shopify",
    meta.error && "Meta Ads",
  ].filter(Boolean);

  const revenueTrendProp = revenueTrend
    ? {
        value: revenueTrend.percentChange,
        direction: revenueTrend.percentChange > 0 ? "up" as const : revenueTrend.percentChange < 0 ? "down" as const : "neutral" as const,
        isPositive: revenueTrend.percentChange >= 0,
      }
    : undefined;

  return (
    <div>
      <PageHeader
        title="Analytics & Attribution"
        description={`${dateLabel} · ${profileCount} ${profileCount === 1 ? "negocio" : "negocios"}`}
      />

      {errorSources.length > 0 && (
        <ErrorDisplay
          message={`Error al cargar datos de: ${errorSources.join(", ")}. Las demas fuentes funcionan correctamente.`}
        />
      )}

      {/* KPIs — all in one row: 3 featured + 2×2 small */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr] mb-6 items-stretch">
        {/* 3 large featured */}
        <KPICard
          title="Ingresos Totales"
          value={revenue}
          formattedValue={formatMoney(revenue)}
          icon={DollarSign}
          iconClassName="text-emerald-500"
          isLoading={shopify.isLoading}
          featured
          trend={revenueTrendProp}
        />
        <KPICard
          title="Ganancia Neta"
          value={netProfit}
          formattedValue={formatMoney(netProfit)}
          icon={Percent}
          iconClassName={netProfit >= 0 ? "text-emerald-500" : "text-red-500"}
          isLoading={isLoadingMain}
          featured
          trend={revenueTrendProp}
        />
        <KPICard
          title="ROAS"
          value={roas}
          formattedValue={`${roas.toFixed(2)}x`}
          icon={TrendingUp}
          iconClassName="text-teal-500"
          isLoading={meta.isLoading}
          featured
        />

        {/* 4 small in 2×2, occupying the last 2 columns */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <KPICard
            title="Pedidos"
            value={orderCount}
            formattedValue={formatNumber(orderCount)}
            icon={ShoppingCart}
            iconClassName="text-blue-500"
            isLoading={shopify.isLoading}
            subtitle={`~${(orderCount / dayCount).toFixed(1)} pedidos/día`}
          />
          <KPICard
            title="Ticket Promedio"
            value={aov}
            formattedValue={formatMoney(aov)}
            icon={Receipt}
            iconClassName="text-emerald-500"
            isLoading={shopify.isLoading}
            subtitle={metaConversions > 0 ? `${formatNumber(metaConversions)} conv. Meta` : undefined}
          />
          <KPICard
            title="Gasto en Ads"
            value={adSpend}
            formattedValue={formatMoney(adSpend)}
            icon={Megaphone}
            iconClassName="text-red-500"
            isLoading={meta.isLoading}
            subtitle={`~${formatMoney(adSpend / dayCount)}/día`}
          />
          <KPICard
            title="Costo x Resultado"
            value={costPerResult}
            formattedValue={formatMoney(costPerResult)}
            icon={Target}
            iconClassName="text-orange-500"
            isLoading={isLoadingMain}
            subtitle={metaConversions > 0 ? `${formatNumber(metaConversions)} conv. atribuidas` : undefined}
          />
        </div>
      </div>

      {/* Alertas & Insights + Attribution */}
      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        {/* Alertas */}
        <Card className="h-full">
          <CardContent className="px-4 py-3 h-full">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Alertas & Insights
            </p>
            {isLoadingMain ? (
              <div className="space-y-2.5">
                {[1,2,3,4,5,6].map((i) => <div key={i} className="h-4 bg-muted/40 rounded animate-pulse" />)}
              </div>
            ) : insights.length > 0 ? (
              <div className="space-y-2.5">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    {insight.type === "warning" && <AlertTriangle className="h-[15px] w-[15px] text-amber-400 flex-shrink-0 mt-0.5" />}
                    {insight.type === "success" && <CheckCircle2 className="h-[15px] w-[15px] text-emerald-400 flex-shrink-0 mt-0.5" />}
                    {insight.type === "info" && <Info className="h-[15px] w-[15px] text-blue-400 flex-shrink-0 mt-0.5" />}
                    <span className="text-[13px] leading-snug text-foreground/90">{insight.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">Sin alertas para este periodo.</p>
            )}
          </CardContent>
        </Card>

        {/* Attribution */}
        <SalesAttribution
          totalRevenue={revenue}
          totalOrders={orderCount}
          metaRevenue={metaRevenue}
          metaConversions={metaConversions}
          isLoading={isLoadingMain}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <RoasDailyChart data={combinedData} isLoading={isLoadingMain} />
        <ConversionsDailyChart data={combinedData} isLoading={isLoadingMain} />
      </div>

      {/* Campaign performance table */}
      <div className="mb-6">
        <CampaignPerformanceCard
          campaigns={campaignsQuery.data?.campaigns ?? []}
          isLoading={campaignsQuery.isLoading}
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
          profileBreakdown={funnelBreakdown}
        />
      </div>

      {/* Orders table */}
      <div className="mb-6">
        <RecentOrdersCard
          orders={orderList.data ?? []}
          isLoading={orderList.isLoading}
          aggregateMode={aggregateMode}
        />
      </div>
    </div>
  );
}
