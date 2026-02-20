"use client";

import { useMemo } from "react";
import {
  DollarSign,
  ShoppingCart,
  Receipt,
  Megaphone,
  TrendingUp,
  Percent,
  Eye,
  Users,
  AlertTriangle,
  Monitor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { SpendVsRevenueChart } from "@/components/roi/spend-vs-revenue";
import { MarketingFunnel } from "@/components/panel/marketing-funnel";
import { TopCampaignsCard } from "@/components/panel/top-campaigns-card";
import { SalesAttribution } from "@/components/panel/sales-attribution";
import { SectionLabel } from "@/components/panel/section-label";
import { useShopifyOrders } from "@/hooks/use-shopify-orders";
import { useShopifyAnalytics } from "@/hooks/use-shopify-analytics";
import { useMetaAccount } from "@/hooks/use-meta-account";
import { useMetaCampaigns } from "@/hooks/use-meta-campaigns";
import { useClarity } from "@/hooks/use-clarity";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function PanelGeneralPage() {
  const shopify = useShopifyOrders();
  const analytics = useShopifyAnalytics();
  const meta = useMetaAccount();
  const campaigns = useMetaCampaigns();
  const clarity = useClarity();

  const isLoadingMain = shopify.isLoading || meta.isLoading;
  const isLoadingAll = isLoadingMain || clarity.isLoading;

  const revenue = shopify.data?.totalRevenue ?? 0;
  const orderCount = shopify.data?.orderCount ?? 0;
  const aov = shopify.data?.averageOrderValue ?? 0;
  const adSpend = meta.data?.spend ?? 0;
  const roas = meta.data?.roas ?? 0;
  const metaRevenue = meta.data?.purchaseRevenue ?? 0;
  const metaConversions = meta.data?.conversions ?? 0;
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

  // Clarity frustration score
  const totalFrustration =
    (clarity.data?.frustration.deadClicks ?? 0) +
    (clarity.data?.frustration.rageClicks ?? 0) +
    (clarity.data?.frustration.quickbacks ?? 0) +
    (clarity.data?.frustration.errorClicks ?? 0);

  // Device breakdown for mini visualization
  const devices = clarity.data?.devices ?? [];
  const totalDeviceSessions = devices.reduce((sum, d) => sum + d.sessions, 0);

  // Error messages
  const errorSources = [
    shopify.error && "Shopify",
    meta.error && "Meta Ads",
    clarity.error && "Clarity",
  ].filter(Boolean);

  return (
    <div>
      <PageHeader
        title="Panel General"
        description="Vista ejecutiva con datos de Shopify, Meta Ads y Clarity"
      />

      {errorSources.length > 0 && (
        <ErrorDisplay
          message={`Error al cargar datos de: ${errorSources.join(", ")}. Las demás fuentes funcionan correctamente.`}
        />
      )}

      {/* Section 1: Core Business KPIs */}
      <SectionLabel title="Métricas principales" />
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
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

      {/* Section 2: Cross-Source Visualizations */}
      <SectionLabel title="Visualizaciones cruzadas" />
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <MarketingFunnel
          impressions={meta.data?.impressions ?? 0}
          clicks={meta.data?.clicks ?? 0}
          landingSessions={analytics.data?.checkoutSessions ?? 0}
          checkouts={analytics.data?.checkoutCount ?? 0}
          orders={orderCount}
          isLoading={isLoadingMain || analytics.isLoading}
        />
        <SpendVsRevenueChart data={combinedData} isLoading={isLoadingMain} />
      </div>

      {/* Section 2.5: Sales Attribution */}
      <SectionLabel title="Atribucion de ventas" />
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <SalesAttribution
          totalRevenue={revenue}
          totalOrders={orderCount}
          metaRevenue={metaRevenue}
          metaConversions={metaConversions}
          isLoading={isLoadingMain}
        />
      </div>

      {/* Section 3: UX Health + Top Campaigns */}
      <SectionLabel title="UX y Campañas" />
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        {/* UX Health Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Salud UX</CardTitle>
            <Badge variant="outline" className="text-xs">
              Últimos 3 días
            </Badge>
          </CardHeader>
          <CardContent>
            {clarity.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <Eye className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-bold">
                      {formatNumber(clarity.data?.traffic.totalSessions ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Sesiones</p>
                  </div>
                  <div className="text-center">
                    <Users className="h-4 w-4 mx-auto mb-1 text-violet-500" />
                    <p className="text-lg font-bold">
                      {formatNumber(clarity.data?.traffic.distinctUsers ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Usuarios</p>
                  </div>
                  <div className="text-center">
                    <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-red-500" />
                    <p className="text-lg font-bold text-red-500">
                      {formatNumber(totalFrustration)}
                    </p>
                    <p className="text-xs text-muted-foreground">Frustración</p>
                  </div>
                </div>

                {/* Device breakdown mini bar */}
                {devices.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      Dispositivos
                    </p>
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      {devices.map((device, i) => {
                        const pct =
                          totalDeviceSessions > 0
                            ? (device.sessions / totalDeviceSessions) * 100
                            : 0;
                        const colors = ["bg-blue-500", "bg-teal-500", "bg-violet-500", "bg-amber-500"];
                        return (
                          <div
                            key={device.name}
                            className={colors[i % colors.length]}
                            style={{ width: `${pct}%` }}
                            title={`${device.name}: ${pct.toFixed(1)}%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      {devices.slice(0, 3).map((device, i) => {
                        const pct =
                          totalDeviceSessions > 0
                            ? (device.sessions / totalDeviceSessions) * 100
                            : 0;
                        const dotColors = ["bg-blue-500", "bg-teal-500", "bg-violet-500"];
                        return (
                          <span key={device.name} className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={`inline-block h-2 w-2 rounded-full ${dotColors[i % dotColors.length]}`} />
                            {device.name} {pct.toFixed(0)}%
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <TopCampaignsCard
          campaigns={campaigns.data?.campaigns ?? []}
          isLoading={campaigns.isLoading}
        />
      </div>
    </div>
  );
}
