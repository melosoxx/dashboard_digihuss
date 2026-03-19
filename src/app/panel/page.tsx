"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Instagram,
  Eye,
  Users,
  BarChart3,
  ArrowDownUp,
  Clock,
  Monitor,
  Globe,
  MousePointerClick,
  Flame,
  CircleDot,
  ExternalLink,
  Map as MapIcon,
  RefreshCw,
} from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import type { ProfileBreakdownItem, KPIDetailItem } from "@/components/dashboard/kpi-card";
import { ErrorDisplay } from "@/components/shared/error-display";
import { RoasDailyChart } from "@/components/panel/roas-daily-chart";
import { ConversionsDailyChart } from "@/components/panel/conversions-daily-chart";
import { MarketingFunnel } from "@/components/panel/marketing-funnel";
import { RecentOrdersCard } from "@/components/panel/recent-orders-card";
import { EmailComposer } from "@/components/comprobantes/email-composer";
import { SalesAttribution } from "@/components/panel/sales-attribution";
import { AIAssistantBar } from "@/components/panel/ai-assistant-bar";
import { ExploreDataTable } from "@/components/panel/explore-data-table";
import type { ExploreColumnDef } from "@/components/panel/explore-data-table";
import { SpendChart } from "@/components/ads/spend-chart";
import { CampaignTable } from "@/components/ads/campaign-table";
import { AdsetTable } from "@/components/ads/adset-table";
import { ActiveAdsCard } from "@/components/panel/top-campaigns-card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ClarityWeekStrip } from "@/components/clarity/clarity-fetch-control";
import { useShopifyOrders } from "@/hooks/use-shopify-orders";
import { useShopifyOrderList } from "@/hooks/use-shopify-order-list";
import { useShopifyAnalytics } from "@/hooks/use-shopify-analytics";
import { useMetaAccount } from "@/hooks/use-meta-account";
import { useMetaCampaigns, useMetaAds, useMetaAdsets } from "@/hooks/use-meta-campaigns";
import { useMetaPromotions } from "@/hooks/use-meta-promotions";
import { useMercadoPago } from "@/hooks/use-mercadopago";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useClarity } from "@/hooks/use-clarity";
import { useClarityAllProfiles, type ProfileClarityData } from "@/hooks/use-clarity-all-profiles";
import { useDateRange } from "@/providers/date-range-provider";
import { formatNumber, cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import type { ClarityInsights } from "@/types/clarity";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import type { ComposerData } from "@/types/email";

function formatDateDisplay(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

// ── Clarity helpers ──────────────────────────────────────────────────────────

interface ClarityBreakdownResult {
  items: ProfileBreakdownItem[];
  totalValue: number;
  totalFormatted: string;
}

function buildClarityBreakdown(
  profilesData: ProfileClarityData[],
  extractor: (d: ClarityInsights) => number,
  formatter: (v: number) => string,
  aggregation: "sum" | "average" = "sum"
): ClarityBreakdownResult {
  const items = profilesData
    .filter((p) => p.data !== null)
    .map((p) => ({
      profileName: p.profileName,
      profileColor: p.profileColor,
      rawValue: extractor(p.data!),
      formattedValue: formatter(extractor(p.data!)),
    }));
  const sum = items.reduce((s, item) => s + item.rawValue, 0);
  const totalValue = aggregation === "average" && items.length > 0 ? sum / items.length : sum;
  return { items, totalValue, totalFormatted: formatter(totalValue) };
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function ClarityBreakdownCard({
  title,
  icon: Icon,
  items,
  isLoading,
}: {
  title: string;
  icon: typeof Monitor;
  items: Array<{ name: string; sessions: number }>;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-2 flex-1 overflow-y-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }
  const total = items.reduce((s, i) => s + i.sessions, 0);
  return (
    <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 flex-shrink-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3 flex-1 overflow-y-auto">
        {items.map((item) => {
          const pct = total > 0 ? (item.sessions / total) * 100 : 0;
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="truncate mr-2">{item.name}</span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {formatNumber(item.sessions)} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Sin datos</p>
        )}
      </CardContent>
    </Card>
  );
}

function CompactHeatmapLink() {
  const { activeProfileId } = useBusinessProfile();
  const [projectId, setProjectId] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeProfileId) params.set("profileId", activeProfileId);
    fetch(`/api/clarity/project-id?${params}`)
      .then((res) => res.json())
      .then((data: { projectId: string | null }) => setProjectId(data.projectId))
      .catch(() => setProjectId(null));
  }, [activeProfileId]);
  const clarityUrl = projectId
    ? `https://clarity.microsoft.com/projects/view/${projectId}/heatmaps`
    : null;
  if (!clarityUrl) return null;
  return (
    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" asChild>
      <a href={clarityUrl} target="_blank" rel="noopener noreferrer">
        <MapIcon className="h-3 w-3 text-blue-400" />
        Heatmaps
        <ExternalLink className="h-2.5 w-2.5" />
      </a>
    </Button>
  );
}

export default function PanelGeneralPage() {
  const { formatMoney } = useCurrency();
  const { aggregateMode, profiles, selectedProfileIds } = useBusinessProfile();
  const { dateRange } = useDateRange();
  const shopify = useShopifyOrders();
  const orderList = useShopifyOrderList();
  const analytics = useShopifyAnalytics();
  const meta = useMetaAccount();
  const clarity = useClarity();
  const campaignsQuery = useMetaCampaigns();
  const ads = useMetaAds();
  const adsets = useMetaAdsets();
  const promotions = useMetaPromotions();
  const mp = useMercadoPago();
  const isMobile = useIsMobile();
  const [resumenView, setResumenView] = useState<"kpis" | "alertas" | "atribucion">("kpis");
  const [rendimientoTab, setRendimientoTab] = useState("embudo");
  const [anunciosTab, setAnunciosTab] = useState("meta-ads");
  const [promoStatusTab, setPromoStatusTab] = useState("promo-activas");
  const [clarityTab, setClarityTab] = useState("cl-resumen");
  const isLoadingMain = shopify.isLoading || meta.isLoading || promotions.isLoading || mp.isLoading;

  // ── Swipe navigation for sub-tabs (mobile only) ──
  const resumenSwipe = useSwipeNavigation({
    items: ["kpis", "alertas", "atribucion"],
    active: resumenView,
    onChangeAction: (v) => setResumenView(v as typeof resumenView),
    enabled: isMobile,
  });
  const rendimientoSwipe = useSwipeNavigation({
    items: ["embudo", "gasto", "conversiones", "roas"],
    active: rendimientoTab,
    onChangeAction: setRendimientoTab,
    enabled: isMobile,
  });
  const anunciosSwipe = useSwipeNavigation({
    items: ["meta-ads", "campanas-table", "conjuntos-table", "promociones-ig"],
    active: anunciosTab,
    onChangeAction: setAnunciosTab,
    enabled: isMobile,
  });
  const claritySwipe = useSwipeNavigation({
    items: ["cl-resumen", "cl-trafico", "cl-frustracion", "cl-datos"],
    active: clarityTab,
    onChangeAction: setClarityTab,
    enabled: isMobile,
  });

  // Clarity multi-profile data
  const {
    profilesData: allProfilesClarity,
    isLoading: allProfilesClarityLoading,
    isFetching: clarityIsFetching,
    lastFetchedAt: clarityLastFetchedAt,
    fetchAllToday: clarityFetchAllToday,
    isManualFetching: clarityIsManualFetching,
    rateLimited: clarityRateLimited,
  } = useClarityAllProfiles();

  const claritySesiones = buildClarityBreakdown(allProfilesClarity, (d) => d.traffic.totalSessions, formatNumber);
  const clarityUsuarios = buildClarityBreakdown(allProfilesClarity, (d) => d.traffic.distinctUsers, formatNumber);
  const clarityPaginas = buildClarityBreakdown(allProfilesClarity, (d) => d.traffic.pagesPerSession, (v) => v.toFixed(2), "average");
  const clarityScroll = buildClarityBreakdown(allProfilesClarity, (d) => d.scrollDepth, (v) => `${v.toFixed(1)}%`, "average");
  const clarityTiempo = buildClarityBreakdown(allProfilesClarity, (d) => d.engagement.activeTime, formatSeconds);

  const totalFrustration =
    (clarity.data?.frustration.deadClicks ?? 0) +
    (clarity.data?.frustration.rageClicks ?? 0) +
    (clarity.data?.frustration.quickbacks ?? 0) +
    (clarity.data?.frustration.errorClicks ?? 0);

  const clarityIsWorking = clarityIsFetching || clarityIsManualFetching;

  // Pedidos subtabs state
  const [pedidosTab, setPedidosTab] = useState("pedidos-recibidos");
  const [composerData, setComposerData] = useState<ComposerData | null>(null);


  const pedidosSwipe = useSwipeNavigation({
    items: ["pedidos-recibidos", "envios"],
    active: pedidosTab,
    onChangeAction: setPedidosTab,
    enabled: isMobile,
  });

  const handleCompose = useCallback((data: ComposerData) => {
    setComposerData(data);
    setPedidosTab("envios");
  }, []);

  const revenue = shopify.data?.totalRevenue ?? 0;
  const orderCount = shopify.data?.orderCount ?? 0;
  const aov = shopify.data?.averageOrderValue ?? 0;
  const adSpend = meta.data?.spend ?? 0;
  const roas = adSpend > 0 ? revenue / adSpend : 0;
  const metaRevenue = meta.data?.purchaseRevenue ?? 0;
  const metaConversions = meta.data?.conversions ?? 0;
  const igPromoSpend = promotions.data?.spend ?? 0;
  const mpFees = mp.data?.totalFees ?? 0;
  const totalAdSpend = adSpend + igPromoSpend;
  const totalGasto = totalAdSpend + mpFees;
  const costPerResult = orderCount > 0 ? totalAdSpend / orderCount : 0;
  const netProfit = revenue - totalGasto;

  const revenueTrend = analytics.data?.periodComparison;

  const dayCount = useMemo(() => {
    const start = new Date(dateRange.startDate + "T00:00:00");
    const end = new Date(dateRange.endDate + "T00:00:00");
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  }, [dateRange.startDate, dateRange.endDate]);

  const insights = useMemo(() => {
    const list: { type: "warning" | "success" | "info"; message: string }[] = [];

    if (!isLoadingMain) {
      if (roas > 0 && roas < 2) {
        list.push({ type: "warning", message: `ROAS actual (${roas.toFixed(2)}x) está por debajo del mínimo recomendado de 2x` });
      } else if (roas >= 2 && roas < 4) {
        list.push({ type: "info", message: `ROAS de ${roas.toFixed(2)}x — rentable, pero con margen de mejora` });
      } else if (roas >= 4) {
        list.push({ type: "success", message: `ROAS de ${roas.toFixed(2)}x — excelente rendimiento de campañas` });
      }

      if (revenueTrend && revenueTrend.percentChange !== 0) {
        const dir = revenueTrend.percentChange > 0 ? "subieron" : "bajaron";
        list.push({
          type: revenueTrend.percentChange > 0 ? "success" : "warning",
          message: `Ingresos ${dir} un ${Math.abs(revenueTrend.percentChange).toFixed(1)}% respecto al periodo anterior`,
        });
      }

      const bestDay = shopify.data?.dailyRevenue?.reduce(
        (best, d) => (d.revenue > (best?.revenue ?? 0) ? d : best),
        null as null | { date: string; revenue: number; orders: number }
      );
      if (bestDay && bestDay.revenue > 0) {
        const label = new Date(bestDay.date + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
        list.push({ type: "success", message: `Mejor día del periodo: ${label} con ${formatMoney(bestDay.revenue)} en ingresos` });
      }

      const campaigns = campaignsQuery.data?.campaigns ?? [];
      if (campaigns.length > 0) {
        const best = campaigns.reduce((b, c) => (c.roas > b.roas ? c : b), campaigns[0]);
        if (best.roas > 0) {
          list.push({ type: "info", message: `Mejor campaña: "${best.campaignName}" con ROAS ${best.roas.toFixed(2)}x` });
        }
      }

      if (costPerResult > 0) {
        list.push({ type: "info", message: `Costo por resultado promedio: ${formatMoney(costPerResult)} por pedido` });
      }

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
        landingSessions: 0,
        checkouts: a?.checkoutSessions ?? 0,
        orders: s?.orderCount ?? 0,
      };
    });
  }, [aggregateMode, profiles, shopify.profileBreakdown, analytics.profileBreakdown, meta.profileBreakdown]);

  const errorSources = [
    shopify.error && "Shopify",
    meta.error && "Meta Ads",
    promotions.error && "Instagram Promos",
  ].filter(Boolean);

  const revenueTrendProp = revenueTrend
    ? {
        value: revenueTrend.percentChange,
        direction: revenueTrend.percentChange > 0 ? "up" as const : revenueTrend.percentChange < 0 ? "down" as const : "neutral" as const,
        isPositive: revenueTrend.percentChange >= 0,
      }
    : undefined;

  // ── KPI detail items (composición) ──────────────────────────────────────────
  const bestDay = useMemo(() => {
    return shopify.data?.dailyRevenue?.reduce(
      (best, d) => (d.revenue > (best?.revenue ?? 0) ? d : best),
      null as null | { date: string; revenue: number; orders: number }
    ) ?? null;
  }, [shopify.data?.dailyRevenue]);

  const bestOrderDay = useMemo(() => {
    return shopify.data?.dailyRevenue?.reduce(
      (best, d) => ((d.orders ?? 0) > (best?.orders ?? 0) ? d : best),
      null as null | { date: string; revenue: number; orders: number }
    ) ?? null;
  }, [shopify.data?.dailyRevenue]);

  const formatDateShort = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" });

  const ingresoDetails: KPIDetailItem[] = useMemo(() => {
    const items: KPIDetailItem[] = [
      { label: "Promedio diario", value: formatMoney(revenue / dayCount) },
    ];
    if (bestDay && bestDay.revenue > 0) {
      items.push({ label: `Mejor día (${formatDateShort(bestDay.date)})`, value: formatMoney(bestDay.revenue), highlighted: true });
    }
    if (dayCount > 1) {
      items.push({ label: "Días del periodo", value: String(dayCount) });
    }
    return items;
  }, [revenue, dayCount, bestDay, formatMoney]);

  const gananciaDetails: KPIDetailItem[] = useMemo(() => {
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const items: KPIDetailItem[] = [
      { label: "Ingresos", value: formatMoney(revenue) },
      { label: "Meta Ads", value: `- ${formatMoney(adSpend)}` },
    ];
    if (igPromoSpend > 0) {
      items.push({ label: "Promos Instagram", value: `- ${formatMoney(igPromoSpend)}` });
    }
    if (mpFees > 0) {
      items.push({ label: `Comisiones MP (${mp.data?.avgFeePercent?.toFixed(1) ?? 0}%)`, value: `- ${formatMoney(mpFees)}` });
    }
    items.push({ label: "Margen", value: `${margin.toFixed(1)}%`, highlighted: true });
    return items;
  }, [revenue, adSpend, igPromoSpend, mpFees, mp.data?.avgFeePercent, netProfit, formatMoney]);

  const roasDetails: KPIDetailItem[] = useMemo(() => {
    const items: KPIDetailItem[] = [
      { label: "Ingresos Shopify", value: formatMoney(revenue) },
      { label: "Gasto en Ads", value: formatMoney(adSpend) },
    ];
    if (metaRevenue > 0) {
      items.push({ label: "Revenue Meta", value: formatMoney(metaRevenue) });
    }
    return items;
  }, [revenue, adSpend, metaRevenue, formatMoney]);

  const pedidosDetails: KPIDetailItem[] = useMemo(() => {
    const items: KPIDetailItem[] = [
      { label: "Promedio diario", value: (orderCount / dayCount).toFixed(1) },
    ];
    if (bestOrderDay && (bestOrderDay.orders ?? 0) > 0) {
      items.push({ label: `Mejor día (${formatDateShort(bestOrderDay.date)})`, value: `${bestOrderDay.orders} pedidos`, highlighted: true });
    }
    return items;
  }, [orderCount, dayCount, bestOrderDay]);

  const ticketDetails: KPIDetailItem[] = useMemo(() => [
    { label: "Ingresos totales", value: formatMoney(revenue) },
    { label: "Total pedidos", value: formatNumber(orderCount) },
  ], [revenue, orderCount, formatMoney]);

  const gastoDetails: KPIDetailItem[] = useMemo(() => {
    const items: KPIDetailItem[] = [
      { label: "Publicidad", value: formatMoney(adSpend), highlighted: true },
    ];
    if (igPromoSpend > 0) {
      items.push({ label: "Promos Instagram", value: formatMoney(igPromoSpend) });
    }
    items.push({ label: "Promedio diario", value: formatMoney(totalAdSpend / dayCount) });
    return items;
  }, [adSpend, igPromoSpend, totalAdSpend, dayCount, formatMoney]);

  const costoResultadoDetails: KPIDetailItem[] = useMemo(() => {
    const items: KPIDetailItem[] = [
      { label: "Gasto publicitario", value: formatMoney(totalAdSpend), highlighted: true },
      { label: "Meta Ads", value: formatMoney(adSpend) },
    ];
    if (igPromoSpend > 0) {
      items.push({ label: "Promos Instagram", value: formatMoney(igPromoSpend) });
    }
    items.push({ label: "Pedidos", value: formatNumber(orderCount) });
    if (metaConversions > 0) {
      items.push({ label: "Conversiones Meta", value: formatNumber(metaConversions) });
    }
    return items;
  }, [totalAdSpend, adSpend, igPromoSpend, orderCount, metaConversions, formatMoney]);

  // ── Meta Ads detail breakdowns (por campaña) ─────────────────────────────
  const adsGastoDetails: KPIDetailItem[] = useMemo(() => {
    const allAds = ads.data?.activeAds ?? [];
    if (!allAds.length) return [];
    const byCampaign: Record<string, number> = {};
    allAds.forEach((ad) => { byCampaign[ad.campaignName] = (byCampaign[ad.campaignName] ?? 0) + ad.spend; });
    return Object.entries(byCampaign)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, val]) => ({
        label: name.length > 30 ? name.substring(0, 28) + "…" : name,
        value: formatMoney(val),
      }));
  }, [ads.data?.activeAds, formatMoney]);

  const adsImpresionesDetails: KPIDetailItem[] = useMemo(() => {
    const allAds = ads.data?.activeAds ?? [];
    if (!allAds.length) return [];
    const byCampaign: Record<string, number> = {};
    allAds.forEach((ad) => { byCampaign[ad.campaignName] = (byCampaign[ad.campaignName] ?? 0) + ad.impressions; });
    return Object.entries(byCampaign)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, val]) => ({
        label: name.length > 30 ? name.substring(0, 28) + "…" : name,
        value: formatNumber(val),
      }));
  }, [ads.data?.activeAds]);

  const adsClicsDetails: KPIDetailItem[] = useMemo(() => {
    const allAds = ads.data?.activeAds ?? [];
    if (!allAds.length) return [];
    const byCampaign: Record<string, number> = {};
    allAds.forEach((ad) => { byCampaign[ad.campaignName] = (byCampaign[ad.campaignName] ?? 0) + ad.clicks; });
    return Object.entries(byCampaign)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, val]) => ({
        label: name.length > 30 ? name.substring(0, 28) + "…" : name,
        value: formatNumber(val),
      }));
  }, [ads.data?.activeAds]);

  const adsCtrDetails: KPIDetailItem[] = useMemo(() => {
    const allAds = ads.data?.activeAds ?? [];
    if (!allAds.length) return [];
    const byCampaign: Record<string, { clicks: number; impressions: number }> = {};
    allAds.forEach((ad) => {
      if (!byCampaign[ad.campaignName]) byCampaign[ad.campaignName] = { clicks: 0, impressions: 0 };
      byCampaign[ad.campaignName].clicks += ad.clicks;
      byCampaign[ad.campaignName].impressions += ad.impressions;
    });
    const totalImpressions = allAds.reduce((s, ad) => s + ad.impressions, 0);
    const totalClicks = allAds.reduce((s, ad) => s + ad.clicks, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    return Object.entries(byCampaign)
      .filter(([, d]) => d.impressions > 0)
      .map(([name, d]) => ({ name, ctr: (d.clicks / d.impressions) * 100 }))
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5)
      .map(({ name, ctr }) => ({
        label: name.length > 30 ? name.substring(0, 28) + "…" : name,
        value: `${ctr.toFixed(2)}%`,
        highlighted: ctr >= avgCtr,
      }));
  }, [ads.data?.activeAds]);

  // ── Promociones IG breakdowns ─────────────────────────────────────────────
  // Aggregate mode: breakdown by business profile
  const promoGastoBreakdown = useMemo(() =>
    promotions.perProfile?.map((p) => ({
      profileName: p.profileName,
      profileColor: p.profileColor,
      formattedValue: formatMoney(p.insights.spend),
      rawValue: p.insights.spend,
    })),
  [promotions.perProfile, formatMoney]);

  const promoImpresionesBreakdown = useMemo(() =>
    promotions.perProfile?.map((p) => ({
      profileName: p.profileName,
      profileColor: p.profileColor,
      formattedValue: formatNumber(p.insights.impressions),
      rawValue: p.insights.impressions,
    })),
  [promotions.perProfile]);

  const promoClicsBreakdown = useMemo(() =>
    promotions.perProfile?.map((p) => ({
      profileName: p.profileName,
      profileColor: p.profileColor,
      formattedValue: formatNumber(p.insights.clicks),
      rawValue: p.insights.clicks,
    })),
  [promotions.perProfile]);

  const promoCtrBreakdown = useMemo(() =>
    promotions.perProfile?.map((p) => ({
      profileName: p.profileName,
      profileColor: p.profileColor,
      formattedValue: `${p.insights.ctr.toFixed(2)}%`,
      rawValue: p.insights.ctr,
    })),
  [promotions.perProfile]);

  // Single mode: detail by individual ad
  const promoGastoDetails: KPIDetailItem[] = useMemo(() => {
    if (promotions.perProfile) return [];
    const allAds = promotions.ads;
    if (!allAds.length) return [];
    const sorted = [...allAds].sort((a, b) => b.spend - a.spend).slice(0, 5);
    return sorted.map((ad) => ({
      label: ad.adName.length > 30 ? ad.adName.substring(0, 28) + "…" : ad.adName,
      value: formatMoney(ad.spend),
    }));
  }, [promotions.ads, promotions.perProfile, formatMoney]);

  const promoImpresionesDetails: KPIDetailItem[] = useMemo(() => {
    if (promotions.perProfile) return [];
    const allAds = promotions.ads;
    if (!allAds.length) return [];
    const sorted = [...allAds].sort((a, b) => b.impressions - a.impressions).slice(0, 5);
    return sorted.map((ad) => ({
      label: ad.adName.length > 30 ? ad.adName.substring(0, 28) + "…" : ad.adName,
      value: formatNumber(ad.impressions),
    }));
  }, [promotions.ads, promotions.perProfile]);

  const promoClicsDetails: KPIDetailItem[] = useMemo(() => {
    if (promotions.perProfile) return [];
    const allAds = promotions.ads;
    if (!allAds.length) return [];
    const sorted = [...allAds].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
    return sorted.map((ad) => ({
      label: ad.adName.length > 30 ? ad.adName.substring(0, 28) + "…" : ad.adName,
      value: formatNumber(ad.clicks),
    }));
  }, [promotions.ads, promotions.perProfile]);

  const promoCtrDetails: KPIDetailItem[] = useMemo(() => {
    if (promotions.perProfile) return [];
    const allAds = promotions.ads;
    if (!allAds.length) return [];
    return [...allAds]
      .filter((ad) => ad.impressions > 0)
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 5)
      .map((ad) => ({
        label: ad.adName.length > 30 ? ad.adName.substring(0, 28) + "…" : ad.adName,
        value: `${ad.ctr.toFixed(2)}%`,
        highlighted: ad.ctr >= (promotions.data?.ctr ?? 0),
      }));
  }, [promotions.ads, promotions.perProfile, promotions.data?.ctr]);

  // ── Explorar datasets ──────────────────────────────────────────────────────
  const dailyExploreData = useMemo(() =>
    combinedData.map((d) => ({
      date: d.date,
      revenue: d.revenue,
      orders: d.orders,
      adSpend: d.adSpend,
      roas: d.adSpend > 0 ? d.revenue / d.adSpend : 0,
      ticketProm: d.orders > 0 ? d.revenue / d.orders : 0,
    })),
  [combinedData]);

  const campaignsExploreData = useMemo(() =>
    (campaignsQuery.data?.campaigns ?? []).map((c) => ({
      campaignName: c.campaignName,
      spend: c.spend,
      revenue: c.roas * c.spend,
      roas: c.roas,
      orders: c.conversions ?? 0,
    })),
  [campaignsQuery.data]);

  const ordersExploreData = useMemo(() =>
    (orderList.data ?? []).map((o) => ({
      profileName: o.profileName ?? "",
      name: o.name,
      createdAt: o.createdAt,
      customerName: o.customerName ?? "",
      total: o.total,
    })),
  [orderList.data]);

  const dailyColumns: ExploreColumnDef[] = useMemo(() => [
    {
      key: "date",
      label: "Fecha",
      render: (row) => formatDateDisplay(String(row.date)),
      sortValue: (row) => String(row.date),
      searchText: (row) => String(row.date),
      align: "left",
    },
    {
      key: "revenue",
      label: "Ingresos",
      render: (row) => formatMoney(Number(row.revenue)),
      sortValue: (row) => Number(row.revenue),
      align: "right",
      summary: "sum",
      summaryFormat: (v) => formatMoney(v),
    },
    {
      key: "orders",
      label: "Pedidos",
      render: (row) => formatNumber(Number(row.orders)),
      sortValue: (row) => Number(row.orders),
      align: "right",
      summary: "sum",
      summaryFormat: (v) => String(Math.round(v)),
    },
    {
      key: "ticketProm",
      label: "Ticket Prom.",
      render: (row) => formatMoney(Number(row.ticketProm)),
      sortValue: (row) => Number(row.ticketProm),
      align: "right",
      summary: "avg",
      summaryFormat: (v) => formatMoney(v),
    },
    {
      key: "adSpend",
      label: "Gasto Ads",
      render: (row) => formatMoney(Number(row.adSpend)),
      sortValue: (row) => Number(row.adSpend),
      align: "right",
      summary: "sum",
      summaryFormat: (v) => formatMoney(v),
    },
    {
      key: "roas",
      label: "ROAS",
      render: (row) => {
        const v = Number(row.roas);
        const color = v >= 4 ? "text-emerald-600 dark:text-emerald-400" : v >= 2 ? "text-amber-600 dark:text-amber-400" : v > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
        return <span className={color}>{v > 0 ? `${v.toFixed(2)}x` : "—"}</span>;
      },
      sortValue: (row) => Number(row.roas),
      align: "right",
      summary: "avg",
      summaryFormat: (v) => `${v.toFixed(2)}x`,
    },
  ], [formatMoney]);

  const campaignColumns: ExploreColumnDef[] = useMemo(() => [
    {
      key: "campaignName",
      label: "Campaña",
      render: (row) => <span className="max-w-[200px] truncate block">{String(row.campaignName)}</span>,
      sortValue: (row) => String(row.campaignName),
      searchText: (row) => String(row.campaignName),
      align: "left",
    },
    {
      key: "spend",
      label: "Gasto",
      render: (row) => formatMoney(Number(row.spend)),
      sortValue: (row) => Number(row.spend),
      align: "right",
      summary: "sum",
      summaryFormat: (v) => formatMoney(v),
    },
    {
      key: "revenue",
      label: "Ingresos",
      render: (row) => formatMoney(Number(row.revenue)),
      sortValue: (row) => Number(row.revenue),
      align: "right",
      summary: "sum",
      summaryFormat: (v) => formatMoney(v),
    },
    {
      key: "roas",
      label: "ROAS",
      render: (row) => {
        const v = Number(row.roas);
        const color = v >= 4 ? "text-emerald-600 dark:text-emerald-400" : v >= 2 ? "text-amber-600 dark:text-amber-400" : v > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
        return <span className={color}>{v > 0 ? `${v.toFixed(2)}x` : "—"}</span>;
      },
      sortValue: (row) => Number(row.roas),
      align: "right",
      summary: "avg",
      summaryFormat: (v) => `${v.toFixed(2)}x`,
    },
    {
      key: "orders",
      label: "Pedidos",
      render: (row) => formatNumber(Number(row.orders)),
      sortValue: (row) => Number(row.orders),
      align: "right",
      summary: "sum",
      summaryFormat: (v) => String(Math.round(v)),
    },
  ], [formatMoney]);

  const ordersColumns: ExploreColumnDef[] = useMemo(() => {
    const cols: ExploreColumnDef[] = [];
    if (aggregateMode) {
      cols.push({
        key: "profileName",
        label: "Perfil",
        render: (row) => <span className="text-muted-foreground">{String(row.profileName)}</span>,
        sortValue: (row) => String(row.profileName),
        searchText: (row) => String(row.profileName),
        align: "left",
      });
    }
    cols.push(
      {
        key: "name",
        label: "Pedido",
        render: (row) => <span className="font-medium">{String(row.name)}</span>,
        sortValue: (row) => String(row.name),
        searchText: (row) => String(row.name),
        align: "left",
      },
      {
        key: "createdAt",
        label: "Fecha",
        render: (row) => {
          const d = String(row.createdAt);
          if (!d) return "—";
          return new Date(d).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
        },
        sortValue: (row) => String(row.createdAt),
        align: "left",
      },
      {
        key: "customerName",
        label: "Cliente",
        render: (row) => <span className="text-muted-foreground">{String(row.customerName)}</span>,
        sortValue: (row) => String(row.customerName),
        searchText: (row) => String(row.customerName),
        align: "left",
      },
      {
        key: "total",
        label: "Total",
        render: (row) => formatMoney(Number(row.total)),
        sortValue: (row) => Number(row.total),
        align: "right",
        summary: "sum",
        summaryFormat: (v) => formatMoney(v),
      }
    );
    return cols;
  }, [aggregateMode, formatMoney]);

  return (
    <TooltipProvider>
    <div className="h-full flex flex-col gap-1">
      {errorSources.length > 0 && (
        <ErrorDisplay
          message={`Error al cargar datos de: ${errorSources.join(", ")}. Las demas fuentes funcionan correctamente.`}
        />
      )}

      <AIAssistantBar placeholder="Preguntale algo a tus datos..." />

      <Tabs defaultValue="resumen" className="flex-1 flex flex-col min-h-0">
        <TabsList
          variant="default"
          className="flex-shrink-0 w-full h-9 overflow-x-auto scrollbar-none justify-start sm:justify-center"
        >
          <TabsTrigger value="resumen" className="flex-none sm:flex-1 px-3">Resumen</TabsTrigger>
          <TabsTrigger value="campanas" className="flex-none sm:flex-1 px-3">Rendimiento</TabsTrigger>
          <TabsTrigger value="anuncios" className="flex-none sm:flex-1 px-3">Anuncios</TabsTrigger>
          <TabsTrigger value="pedidos" className="flex-none sm:flex-1 px-3">Pedidos</TabsTrigger>
          <TabsTrigger value="clarity" className="flex-none sm:flex-1 px-3">Clarity</TabsTrigger>
          <TabsTrigger value="explorar" className="flex-none sm:flex-1 px-3">Explorar</TabsTrigger>
        </TabsList>

        {/* ── Tab: Resumen ──────────────────────────────────────────────── */}
        <TabsContent
          value="resumen"
          className="flex-1 min-h-0 overflow-hidden mt-2 animate-in fade-in-0 duration-200"
        >
          {isMobile ? (
            /* ── Mobile: sub-vistas con segmented control ── */
            <div className="h-full flex flex-col">
              <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg mb-2 flex-shrink-0">
                {(["kpis", "alertas", "atribucion"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setResumenView(v)}
                    className={cn(
                      "flex-1 text-[11px] font-medium py-1.5 rounded-md transition-colors",
                      resumenView === v
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground"
                    )}
                  >
                    {v === "kpis" ? "KPIs" : v === "alertas" ? "Alertas" : "Atribución"}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto" onTouchStart={resumenSwipe.onTouchStart} onTouchEnd={resumenSwipe.onTouchEnd}>
                {resumenView === "kpis" && (
                  <div className="grid gap-2 grid-cols-2 items-start">
                    <KPICard title="Ingresos Totales" value={revenue} formattedValue={formatMoney(revenue)} icon={DollarSign} iconClassName="text-emerald-500" isLoading={shopify.isLoading} trend={revenueTrendProp} detailItems={ingresoDetails} />
                    <KPICard title="Ganancia Neta" value={netProfit} formattedValue={formatMoney(netProfit)} icon={Percent} iconClassName={netProfit >= 0 ? "text-emerald-500" : "text-red-500"} isLoading={isLoadingMain} trend={revenueTrendProp} detailItems={gananciaDetails} />
                    <KPICard title="ROAS" value={roas} formattedValue={`${roas.toFixed(2)}x`} icon={TrendingUp} iconClassName="text-teal-500" isLoading={meta.isLoading} detailItems={roasDetails} />
                    <KPICard title="Pedidos" value={orderCount} formattedValue={formatNumber(orderCount)} icon={ShoppingCart} iconClassName="text-blue-500" isLoading={shopify.isLoading} subtitle={`~${(orderCount / dayCount).toFixed(1)} por día`} detailItems={pedidosDetails} />
                    <KPICard title="Gasto en Ads" value={totalAdSpend} formattedValue={formatMoney(totalAdSpend)} icon={Megaphone} iconClassName="text-red-500" isLoading={isLoadingMain} detailItems={gastoDetails} />
                    <KPICard title="Costo x Resultado" value={costPerResult} formattedValue={formatMoney(costPerResult)} icon={Target} iconClassName="text-orange-500" isLoading={isLoadingMain} subtitle={metaConversions > 0 ? `${formatNumber(metaConversions)} conv.` : undefined} detailItems={costoResultadoDetails} />
                  </div>
                )}

                {resumenView === "alertas" && (
                  <Card className="py-0 gap-0 rounded-2xl">
                    <CardContent className="p-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
                        Alertas & Insights
                      </p>
                      {isLoadingMain ? (
                        <div className="space-y-5">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-4 bg-muted/40 rounded animate-pulse" />
                          ))}
                        </div>
                      ) : insights.length > 0 ? (
                        <div className="space-y-5">
                          {insights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-3">
                              {insight.type === "warning" && (
                                <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full border border-amber-500 flex items-center justify-center">
                                  <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
                                </div>
                              )}
                              {insight.type === "success" && (
                                <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full border border-emerald-500 flex items-center justify-center">
                                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                </div>
                              )}
                              {insight.type === "info" && (
                                <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full border border-blue-500 flex items-center justify-center">
                                  <Info className="h-2.5 w-2.5 text-blue-500" />
                                </div>
                              )}
                              <span className="text-sm leading-snug text-foreground/70">{insight.message}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin alertas para este periodo.</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {resumenView === "atribucion" && (
                  <SalesAttribution
                    totalRevenue={revenue}
                    totalOrders={orderCount}
                    metaRevenue={metaRevenue}
                    metaConversions={metaConversions}
                    isLoading={isLoadingMain}
                  />
                )}
              </div>
            </div>
          ) : (
            /* ── Desktop: layout original sin cambios ── */
            <div className="h-full flex flex-col gap-6 overflow-hidden">
              {/* KPI row — flat single row, 7 cols on desktop */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 flex-shrink-0 items-start">
                <KPICard title="Ingresos Totales" value={revenue} formattedValue={formatMoney(revenue)} icon={DollarSign} iconClassName="text-emerald-500" isLoading={shopify.isLoading} trend={revenueTrendProp} detailItems={ingresoDetails} />
                <KPICard title="Ganancia Neta" value={netProfit} formattedValue={formatMoney(netProfit)} icon={Percent} iconClassName={netProfit >= 0 ? "text-emerald-500" : "text-red-500"} isLoading={isLoadingMain} trend={revenueTrendProp} detailItems={gananciaDetails} />
                <KPICard title="ROAS" value={roas} formattedValue={`${roas.toFixed(2)}x`} icon={TrendingUp} iconClassName="text-teal-500" isLoading={meta.isLoading} detailItems={roasDetails} />
                <KPICard title="Pedidos" value={orderCount} formattedValue={formatNumber(orderCount)} icon={ShoppingCart} iconClassName="text-blue-500" isLoading={shopify.isLoading} subtitle={`~${(orderCount / dayCount).toFixed(1)} por día`} detailItems={pedidosDetails} />
                <KPICard title="Ticket Promedio" value={aov} formattedValue={formatMoney(aov)} icon={Receipt} iconClassName="text-emerald-500" isLoading={shopify.isLoading} detailItems={ticketDetails} />
                <KPICard title="Gasto en Ads" value={totalAdSpend} formattedValue={formatMoney(totalAdSpend)} icon={Megaphone} iconClassName="text-red-500" isLoading={isLoadingMain} detailItems={gastoDetails} />
                <KPICard title="Costo x Resultado" value={costPerResult} formattedValue={formatMoney(costPerResult)} icon={Target} iconClassName="text-orange-500" isLoading={isLoadingMain} subtitle={metaConversions > 0 ? `${formatNumber(metaConversions)} conv.` : undefined} detailItems={costoResultadoDetails} />
              </div>

              {/* Alertas + Attribution */}
              <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                <Card className="col-span-12 lg:col-span-5 h-full overflow-hidden flex flex-col rounded-2xl">
                  <CardContent className="p-6 flex-1 overflow-y-auto">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
                      Alertas & Insights
                    </p>
                    {isLoadingMain ? (
                      <div className="space-y-5">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="h-4 bg-muted/40 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : insights.length > 0 ? (
                      <div className="space-y-5">
                        {insights.map((insight, i) => (
                          <div key={i} className="flex items-start gap-3">
                            {insight.type === "warning" && (
                              <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full border border-amber-500 flex items-center justify-center">
                                <AlertTriangle className="h-2.5 w-2.5 text-amber-500" />
                              </div>
                            )}
                            {insight.type === "success" && (
                              <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full border border-emerald-500 flex items-center justify-center">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                              </div>
                            )}
                            {insight.type === "info" && (
                              <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full border border-blue-500 flex items-center justify-center">
                                <Info className="h-2.5 w-2.5 text-blue-500" />
                              </div>
                            )}
                            <span className="text-sm leading-snug text-foreground/70">{insight.message}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin alertas para este periodo.</p>
                    )}
                  </CardContent>
                </Card>

                <div className="col-span-12 lg:col-span-7">
                  <SalesAttribution
                    totalRevenue={revenue}
                    totalOrders={orderCount}
                    metaRevenue={metaRevenue}
                    metaConversions={metaConversions}
                    isLoading={isLoadingMain}
                  />
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Rendimiento ─────────────────────────────────────────── */}
        <TabsContent
          value="campanas"
          className="flex-1 min-h-0 overflow-hidden mt-2 flex flex-col animate-in fade-in-0 duration-200"
        >
          <Tabs value={rendimientoTab} onValueChange={setRendimientoTab} className="flex-1 flex flex-col min-h-0">
            <TabsList
              variant="line"
              className="flex-shrink-0 w-full h-8 border-b border-border rounded-none bg-transparent gap-0 overflow-x-auto scrollbar-none"
            >
              <TabsTrigger value="embudo" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Embudo</TabsTrigger>
              <TabsTrigger value="gasto" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Gasto</TabsTrigger>
              <TabsTrigger value="conversiones" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Conversiones</TabsTrigger>
              <TabsTrigger value="roas" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">ROAS Diario</TabsTrigger>
            </TabsList>

            {/* Sub-tab: Embudo — marketing funnel */}
            <TabsContent value="embudo" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150" onTouchStart={rendimientoSwipe.onTouchStart} onTouchEnd={rendimientoSwipe.onTouchEnd}>
              <MarketingFunnel
                impressions={meta.data?.impressions ?? 0}
                clicks={meta.data?.clicks ?? 0}
                landingSessions={clarity.data?.traffic.totalSessions ?? 0}
                checkouts={analytics.data?.checkoutSessions ?? 0}
                orders={orderCount}
                isLoading={isLoadingMain || analytics.isLoading || clarity.isLoading}
                profileBreakdown={funnelBreakdown}
                fillHeight
              />
            </TabsContent>

            {/* Sub-tab: Gasto — daily spend chart */}
            <TabsContent value="gasto" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150" onTouchStart={rendimientoSwipe.onTouchStart} onTouchEnd={rendimientoSwipe.onTouchEnd}>
              <SpendChart
                data={meta.data?.dailyMetrics ?? []}
                isLoading={meta.isLoading}
              />
            </TabsContent>

            {/* Sub-tab: Conversiones — fills full height */}
            <TabsContent value="conversiones" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150" onTouchStart={rendimientoSwipe.onTouchStart} onTouchEnd={rendimientoSwipe.onTouchEnd}>
              <ConversionsDailyChart data={combinedData} isLoading={isLoadingMain} fillHeight />
            </TabsContent>

            {/* Sub-tab: ROAS Diario — daily ROAS chart */}
            <TabsContent value="roas" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150" onTouchStart={rendimientoSwipe.onTouchStart} onTouchEnd={rendimientoSwipe.onTouchEnd}>
              <RoasDailyChart data={combinedData} isLoading={isLoadingMain} fillHeight />
            </TabsContent>

          </Tabs>
        </TabsContent>

        {/* ── Tab: Pedidos ──────────────────────────────────────────────── */}
        <TabsContent
          value="pedidos"
          className="flex-1 min-h-0 overflow-hidden mt-2 flex flex-col animate-in fade-in-0 duration-200"
        >
          <Tabs value={pedidosTab} onValueChange={setPedidosTab} className="flex-1 flex flex-col min-h-0">
            <TabsList
              variant="line"
              className="flex-shrink-0 w-full h-8 border-b border-border rounded-none bg-transparent gap-0 overflow-x-auto scrollbar-none"
            >
              <TabsTrigger value="pedidos-recibidos" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Pedidos Recibidos</TabsTrigger>
              <TabsTrigger value="envios" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Envíos</TabsTrigger>
            </TabsList>

            <TabsContent
              value="pedidos-recibidos"
              className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150"
              onTouchStart={pedidosSwipe.onTouchStart}
              onTouchEnd={pedidosSwipe.onTouchEnd}
            >
              <RecentOrdersCard
                orders={orderList.data ?? []}
                isLoading={orderList.isLoading}
                aggregateMode={aggregateMode}
                onCompose={handleCompose}
              />
            </TabsContent>

            <TabsContent
              value="envios"
              className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150"
              onTouchStart={pedidosSwipe.onTouchStart}
              onTouchEnd={pedidosSwipe.onTouchEnd}
            >
              <EmailComposer
                composerData={composerData}
                onDiscard={() => {
                  setComposerData(null);
                  setPedidosTab("pedidos-recibidos");
                }}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── Tab: Anuncios ─────────────────────────────────────────────── */}
        <TabsContent
          value="anuncios"
          className="flex-1 min-h-0 overflow-hidden mt-2 flex flex-col animate-in fade-in-0 duration-200"
        >
          <Tabs value={anunciosTab} onValueChange={setAnunciosTab} className="flex-1 flex flex-col min-h-0">
            <TabsList
              variant="line"
              className="flex-shrink-0 w-full h-8 border-b border-border rounded-none bg-transparent gap-0 overflow-x-auto scrollbar-none"
            >
              <TabsTrigger value="meta-ads" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Publicidad</TabsTrigger>
              <TabsTrigger value="promociones-ig" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Promociones IG</TabsTrigger>
            </TabsList>

            {/* Sub-tab: Publicidad — active ads with preview */}
            <TabsContent value="meta-ads" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150" onTouchStart={anunciosSwipe.onTouchStart} onTouchEnd={anunciosSwipe.onTouchEnd}>
              <div className="h-full flex flex-col gap-2 overflow-hidden">
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 flex-shrink-0">
                  <KPICard
                    title="Gasto Meta"
                    value={ads.data?.activeAds.reduce((sum, ad) => sum + ad.spend, 0) ?? 0}
                    formattedValue={formatMoney(ads.data?.activeAds.reduce((sum, ad) => sum + ad.spend, 0) ?? 0)}
                    icon={TrendingUp}
                    iconClassName="text-blue-500"
                    isLoading={ads.isLoading}
                    detailItems={adsGastoDetails}
                  />
                  <KPICard
                    title="Impresiones"
                    value={ads.data?.activeAds.reduce((sum, ad) => sum + ad.impressions, 0) ?? 0}
                    formattedValue={formatNumber(ads.data?.activeAds.reduce((sum, ad) => sum + ad.impressions, 0) ?? 0)}
                    icon={Eye}
                    iconClassName="text-blue-500"
                    isLoading={ads.isLoading}
                    detailItems={adsImpresionesDetails}
                  />
                  <KPICard
                    title="Clics"
                    value={ads.data?.activeAds.reduce((sum, ad) => sum + ad.clicks, 0) ?? 0}
                    formattedValue={formatNumber(ads.data?.activeAds.reduce((sum, ad) => sum + ad.clicks, 0) ?? 0)}
                    icon={MousePointerClick}
                    iconClassName="text-blue-500"
                    isLoading={ads.isLoading}
                    detailItems={adsClicsDetails}
                  />
                  <KPICard
                    title="CTR Meta"
                    value={
                      (() => {
                        const totalClicks = ads.data?.activeAds.reduce((sum, ad) => sum + ad.clicks, 0) ?? 0;
                        const totalImpressions = ads.data?.activeAds.reduce((sum, ad) => sum + ad.impressions, 0) ?? 0;
                        return totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
                      })()
                    }
                    formattedValue={
                      (() => {
                        const totalClicks = ads.data?.activeAds.reduce((sum, ad) => sum + ad.clicks, 0) ?? 0;
                        const totalImpressions = ads.data?.activeAds.reduce((sum, ad) => sum + ad.impressions, 0) ?? 0;
                        const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
                        return `${ctr.toFixed(2)}%`;
                      })()
                    }
                    icon={Target}
                    iconClassName="text-blue-500"
                    isLoading={ads.isLoading}
                    detailItems={adsCtrDetails}
                  />
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <ActiveAdsCard
                    activeAds={ads.data?.activeAds ?? []}
                    inactiveAds={ads.data?.inactiveAds ?? []}
                    isLoading={ads.isLoading}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Sub-tab: Promociones IG — Instagram promotions */}
            <TabsContent value="promociones-ig" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150" onTouchStart={anunciosSwipe.onTouchStart} onTouchEnd={anunciosSwipe.onTouchEnd}>
              {(promotions.configured || promotions.isLoading) ? (
                <div className="h-full flex flex-col gap-2 overflow-hidden">
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 flex-shrink-0">
                    <KPICard
                      title="Gasto Promos"
                      value={promotions.data?.spend ?? 0}
                      formattedValue={formatMoney(promotions.data?.spend ?? 0)}
                      icon={Instagram}
                      iconClassName="text-fuchsia-500"
                      isLoading={promotions.isLoading}
                      detailItems={promoGastoDetails}
                      breakdown={promoGastoBreakdown}
                    />
                    <KPICard
                      title="Impresiones"
                      value={promotions.data?.impressions ?? 0}
                      formattedValue={formatNumber(promotions.data?.impressions ?? 0)}
                      icon={Instagram}
                      iconClassName="text-fuchsia-500"
                      isLoading={promotions.isLoading}
                      detailItems={promoImpresionesDetails}
                      breakdown={promoImpresionesBreakdown}
                    />
                    <KPICard
                      title="Clics"
                      value={promotions.data?.clicks ?? 0}
                      formattedValue={formatNumber(promotions.data?.clicks ?? 0)}
                      icon={Instagram}
                      iconClassName="text-fuchsia-500"
                      isLoading={promotions.isLoading}
                      detailItems={promoClicsDetails}
                      breakdown={promoClicsBreakdown}
                    />
                    <KPICard
                      title="CTR Promos"
                      value={promotions.data?.ctr ?? 0}
                      formattedValue={`${(promotions.data?.ctr ?? 0).toFixed(2)}%`}
                      icon={Instagram}
                      iconClassName="text-fuchsia-500"
                      isLoading={promotions.isLoading}
                      detailItems={promoCtrDetails}
                      breakdown={promoCtrBreakdown}
                    />
                  </div>
                  <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <CardContent className="flex-1 min-h-0 overflow-hidden px-5 py-4 flex flex-col">
                      <Tabs value={promoStatusTab} onValueChange={setPromoStatusTab} className="flex-1 flex flex-col min-h-0">
                        <TabsList variant="line" className="flex-shrink-0 w-full h-7 border-b border-border rounded-none bg-transparent gap-0 mb-3">
                          <TabsTrigger value="promo-activas" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">
                            Activas ({promotions.activeAds.length})
                          </TabsTrigger>
                          <TabsTrigger value="promo-inactivas" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">
                            Inactivas ({promotions.inactiveAds.length})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="promo-activas" className="flex-1 min-h-0 overflow-y-auto">
                          {promotions.activeAds.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay promociones activas.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-border/30">
                                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Anuncio</th>
                                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Duración</th>
                                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Gasto</th>
                                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Impresiones</th>
                                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">CTR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {promotions.activeAds
                                    .sort((a, b) => b.spend - a.spend)
                                    .map((ad) => (
                                      <tr key={ad.adId} className="border-b border-border/10 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                                        <td className="py-3 pr-6">
                                          <div className="flex items-center gap-3">
                                            {ad.thumbnailUrl && (
                                              <img src={ad.thumbnailUrl} alt="" className="h-9 w-9 rounded-md object-cover flex-shrink-0" />
                                            )}
                                            <div className="min-w-0">
                                              <p className="text-[13px] font-medium truncate max-w-[280px]">{ad.adName}</p>
                                              <p className="text-xs text-muted-foreground truncate max-w-[280px]">{ad.linkUrl || ad.campaignName}</p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 text-right">
                                          <span className="text-[13px] font-semibold text-violet-600 dark:text-violet-300">
                                            {ad.createdAt ? (() => {
                                              const days = Math.floor((Date.now() - new Date(ad.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                                              return days === 0 ? "Hoy" : days === 1 ? "1 día" : `${days} días`;
                                            })() : "—"}
                                          </span>
                                        </td>
                                        <td className="py-3 text-right">
                                          <span className="text-[13px] font-semibold text-violet-600 dark:text-violet-300">{formatMoney(ad.spend)}</span>
                                        </td>
                                        <td className="py-3 text-right">
                                          <span className="text-[13px] font-semibold text-violet-600 dark:text-violet-300">{formatNumber(ad.impressions)}</span>
                                        </td>
                                        <td className="py-3 text-right">
                                          <span className="text-[13px] font-semibold text-violet-600 dark:text-violet-300">{ad.ctr.toFixed(2)}%</span>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="promo-inactivas" className="flex-1 min-h-0 overflow-y-auto">
                          {promotions.inactiveAds.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay promociones inactivas en este periodo.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-border/30">
                                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Anuncio</th>
                                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Estado</th>
                                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Gasto</th>
                                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Impresiones</th>
                                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">CTR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {promotions.inactiveAds
                                    .sort((a, b) => b.spend - a.spend)
                                    .map((ad) => (
                                      <tr key={ad.adId} className="border-b border-border/10 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                                        <td className="py-3 pr-6">
                                          <div className="flex items-center gap-3">
                                            {ad.thumbnailUrl && (
                                              <img src={ad.thumbnailUrl} alt="" className="h-9 w-9 rounded-md object-cover flex-shrink-0 opacity-60" />
                                            )}
                                            <div className="min-w-0">
                                              <p className="text-[13px] font-medium truncate max-w-[280px] text-muted-foreground">{ad.adName}</p>
                                              <p className="text-xs text-muted-foreground/70 truncate max-w-[280px]">{ad.linkUrl || ad.campaignName}</p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3 text-right">
                                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                            {ad.effectiveStatus === "PAUSED" ? "Pausada" :
                                             ad.effectiveStatus === "ARCHIVED" ? "Archivada" :
                                             ad.effectiveStatus === "DELETED" ? "Eliminada" :
                                             "Inactiva"}
                                          </span>
                                        </td>
                                        <td className="py-3 text-right">
                                          <span className="text-[13px] font-semibold text-muted-foreground">{formatMoney(ad.spend)}</span>
                                        </td>
                                        <td className="py-3 text-right">
                                          <span className="text-[13px] font-semibold text-muted-foreground">{formatNumber(ad.impressions)}</span>
                                        </td>
                                        <td className="py-3 text-right">
                                          <span className="text-[13px] font-semibold text-muted-foreground">{ad.ctr.toFixed(2)}%</span>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Promociones de Instagram no configuradas para este perfil.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── Tab: Clarity ─────────────────────────────────────────────── */}
        <TabsContent
          value="clarity"
          className="flex-1 min-h-0 overflow-hidden mt-2 flex flex-col animate-in fade-in-0 duration-200"
        >
          {clarity.error && (
            <div className="flex-shrink-0 rounded-md bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 mb-2 text-[11px] text-red-600 dark:text-red-400">
              Error al cargar datos de Clarity. Verificá tus credenciales.
            </div>
          )}
          <Tabs value={clarityTab} onValueChange={setClarityTab} className="flex-1 flex flex-col min-h-0">
            <TabsList
              variant="line"
              className="flex-shrink-0 w-full h-8 border-b border-border rounded-none bg-transparent gap-0 overflow-x-auto scrollbar-none"
            >
              <TabsTrigger value="cl-resumen" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Resumen</TabsTrigger>
              <TabsTrigger value="cl-trafico" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Tráfico</TabsTrigger>
              <TabsTrigger value="cl-frustracion" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Frustración</TabsTrigger>
              <TabsTrigger value="cl-datos" className="text-xs flex-none sm:flex-1 px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Datos</TabsTrigger>
            </TabsList>

            {/* Sub-tab: Resumen */}
            <TabsContent value="cl-resumen" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150" onTouchStart={claritySwipe.onTouchStart} onTouchEnd={claritySwipe.onTouchEnd}>
              <div className="h-full flex flex-col gap-2 overflow-hidden">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 flex-1">
                    <KPICard title="Sesiones" value={claritySesiones.totalValue} formattedValue={claritySesiones.totalFormatted} icon={Eye} iconClassName="text-blue-500" isLoading={clarity.isLoading || allProfilesClarityLoading} breakdown={claritySesiones.items} breakdownLoading={allProfilesClarityLoading} />
                    <KPICard title="Usuarios Únicos" value={clarityUsuarios.totalValue} formattedValue={clarityUsuarios.totalFormatted} icon={Users} iconClassName="text-violet-500" isLoading={clarity.isLoading || allProfilesClarityLoading} breakdown={clarityUsuarios.items} breakdownLoading={allProfilesClarityLoading} />
                    <KPICard title="Páginas / Sesión" value={clarityPaginas.totalValue} formattedValue={clarityPaginas.totalFormatted} icon={BarChart3} iconClassName="text-teal-500" isLoading={clarity.isLoading || allProfilesClarityLoading} breakdown={clarityPaginas.items} breakdownLoading={allProfilesClarityLoading} />
                    <KPICard title="Prof. de Scroll" value={clarityScroll.totalValue} formattedValue={clarityScroll.totalFormatted} icon={ArrowDownUp} iconClassName="text-amber-500" isLoading={clarity.isLoading || allProfilesClarityLoading} breakdown={clarityScroll.items} breakdownLoading={allProfilesClarityLoading} />
                    <KPICard title="Tiempo Activo" value={clarityTiempo.totalValue} formattedValue={clarityTiempo.totalFormatted} icon={Clock} iconClassName="text-emerald-500" isLoading={clarity.isLoading || allProfilesClarityLoading} breakdown={clarityTiempo.items} breakdownLoading={allProfilesClarityLoading} />
                  </div>
                  <CompactHeatmapLink />
                </div>
                <div className="grid gap-2 lg:grid-cols-2 flex-1 min-h-0">
                  <Card className="h-full overflow-hidden flex flex-col">
                    <CardContent className="px-4 py-3 flex-1 overflow-y-auto">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Señales de Frustración</p>
                      {clarity.isLoading ? (
                        <div className="space-y-2.5">{[1, 2, 3, 4].map((i) => <div key={i} className="h-4 bg-muted/40 rounded animate-pulse" />)}</div>
                      ) : (
                        <div className="space-y-2.5">
                          {[
                            { label: "Clics muertos", value: clarity.data?.frustration.deadClicks ?? 0 },
                            { label: "Clics de rabia", value: clarity.data?.frustration.rageClicks ?? 0 },
                            { label: "Retornos rápidos", value: clarity.data?.frustration.quickbacks ?? 0 },
                            { label: "Errores de script", value: clarity.data?.frustration.scriptErrors ?? 0 },
                            { label: "Scroll excesivo", value: clarity.data?.frustration.excessiveScrolls ?? 0 },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${item.value > 0 ? "bg-red-400" : "bg-muted-foreground/30"}`} />
                                <span className="text-[13px] text-foreground/90">{item.label}</span>
                              </div>
                              <span className={`text-[13px] font-semibold ${item.value > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>{formatNumber(item.value)}</span>
                            </div>
                          ))}
                          <div className="border-t border-border/20 pt-2 mt-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground">Total frustración</span>
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatNumber(totalFrustration)}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="h-full overflow-hidden flex flex-col">
                    <CardContent className="px-4 py-3 flex-1 overflow-y-auto">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Páginas más visitadas</p>
                      {clarity.isLoading ? (
                        <div className="space-y-2.5">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-4 bg-muted/40 rounded animate-pulse" />)}</div>
                      ) : (clarity.data?.topPages ?? []).length > 0 ? (
                        <div className="space-y-2">
                          {(clarity.data?.topPages ?? []).map((page) => {
                            const maxVisits = clarity.data?.topPages?.[0]?.visits ?? 1;
                            const pct = (page.visits / maxVisits) * 100;
                            return (
                              <div key={page.url}>
                                <div className="flex items-center justify-between text-[13px] mb-0.5">
                                  <span className="truncate mr-2 text-foreground/90">{page.url}</span>
                                  <span className="text-muted-foreground whitespace-nowrap">{formatNumber(page.visits)}</span>
                                </div>
                                <div className="h-1 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[13px] text-muted-foreground">Sin datos de páginas.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Sub-tab: Tráfico */}
            <TabsContent value="cl-trafico" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150" onTouchStart={claritySwipe.onTouchStart} onTouchEnd={claritySwipe.onTouchEnd}>
              <div className="h-full grid gap-2 lg:grid-cols-3">
                <ClarityBreakdownCard title="Dispositivos" icon={Monitor} items={clarity.data?.devices ?? []} isLoading={clarity.isLoading} />
                <ClarityBreakdownCard title="Navegadores" icon={Globe} items={clarity.data?.browsers ?? []} isLoading={clarity.isLoading} />
                <ClarityBreakdownCard title="Países" icon={Globe} items={clarity.data?.countries ?? []} isLoading={clarity.isLoading} />
              </div>
            </TabsContent>

            {/* Sub-tab: Frustración */}
            <TabsContent value="cl-frustracion" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150" onTouchStart={claritySwipe.onTouchStart} onTouchEnd={claritySwipe.onTouchEnd}>
              <div className="h-full grid gap-2 grid-cols-2 lg:grid-cols-3">
                {[
                  { title: "Clics Muertos", value: clarity.data?.frustration.deadClicks ?? 0, icon: CircleDot, iconColor: "text-muted-foreground", valueColor: "text-red-500", desc: "Clics en elementos no interactivos" },
                  { title: "Clics de Rabia", value: clarity.data?.frustration.rageClicks ?? 0, icon: Flame, iconColor: "text-red-500", valueColor: "text-red-500", desc: "Clics rápidos repetidos por frustración" },
                  { title: "Retornos Rápidos", value: clarity.data?.frustration.quickbacks ?? 0, icon: MousePointerClick, iconColor: "text-orange-500", valueColor: "text-orange-500", desc: "Usuarios que volvieron atrás rápidamente" },
                  { title: "Clics con Error", value: clarity.data?.frustration.errorClicks ?? 0, icon: AlertTriangle, iconColor: "text-amber-500", valueColor: "text-amber-500", desc: "Clics que generaron errores" },
                  { title: "Errores de Script", value: clarity.data?.frustration.scriptErrors ?? 0, icon: AlertTriangle, iconColor: "text-yellow-500", valueColor: "text-yellow-500", desc: "Errores JavaScript en la página" },
                  { title: "Scroll Excesivo", value: clarity.data?.frustration.excessiveScrolls ?? 0, icon: ArrowDownUp, iconColor: "text-orange-600", valueColor: "text-orange-600", desc: "Scroll desmedido por los usuarios" },
                ].map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Card key={item.title} className="flex flex-col justify-center">
                      <CardContent className="px-4 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.title}</span>
                          <ItemIcon className={`h-4 w-4 ${item.iconColor}`} />
                        </div>
                        {clarity.isLoading ? (
                          <Skeleton className="h-8 w-20" />
                        ) : (
                          <>
                            <div className={`text-3xl font-bold ${item.valueColor}`}>{formatNumber(item.value)}</div>
                            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Sub-tab: Datos */}
            <TabsContent value="cl-datos" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150" onTouchStart={claritySwipe.onTouchStart} onTouchEnd={claritySwipe.onTouchEnd}>
              <div className="h-full flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center justify-between flex-shrink-0">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Recolección de datos</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Los datos se recolectan automáticamente a las 23:59 (Argentina)</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={(clarity.availableDates?.length ?? 0) > 0 ? "outline" : "default"}
                        size="sm"
                        className="gap-1.5"
                        disabled={clarityIsWorking || clarityRateLimited}
                        onClick={clarityFetchAllToday}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${clarityIsManualFetching ? "animate-spin" : ""}`} />
                        {clarityIsManualFetching ? "Actualizando..." : "Actualizar hoy"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[11px]">Consultar API de Clarity para hoy (consume 1 call)</TooltipContent>
                  </Tooltip>
                </div>
                {clarityRateLimited && (
                  <div className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 flex-shrink-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    <p className="text-[11px] text-red-600 dark:text-red-400">Límite diario alcanzado. Se reinicia a medianoche UTC.</p>
                  </div>
                )}
                <Card className="flex-1 flex items-center justify-center">
                  <CardContent className="py-6 px-8 flex flex-col items-center gap-4">
                    <ClarityWeekStrip
                      availableDates={clarity.availableDates ?? []}
                      rangeStart={dateRange.startDate}
                      rangeEnd={dateRange.endDate}
                      large
                    />
                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Días con datos</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{(clarity.availableDates ?? []).length}</p>
                      </div>
                      <div className="h-8 w-px bg-border/30" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cobertura</p>
                        <p className="text-2xl font-bold text-foreground/90">
                          {(() => {
                            const start = new Date(dateRange.startDate + "T00:00:00");
                            const end = new Date(dateRange.endDate + "T00:00:00");
                            const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
                            const pct = totalDays > 0 ? ((clarity.availableDates ?? []).length / totalDays) * 100 : 0;
                            return `${pct.toFixed(0)}%`;
                          })()}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-border/30" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rango</p>
                        <p className="text-sm font-semibold text-foreground/90">
                          {new Date(dateRange.startDate + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                          {" — "}
                          {new Date(dateRange.endDate + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                    {clarityLastFetchedAt && (
                      <p className="text-[10px] text-muted-foreground">
                        Última actualización: {new Date(clarityLastFetchedAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── Tab: Explorar ─────────────────────────────────────────────── */}
        <TabsContent
          value="explorar"
          className="flex-1 min-h-0 overflow-hidden mt-2 animate-in fade-in-0 duration-200"
        >
          <ExploreDataTable
            datasets={[
              {
                label: "Ventas por Día",
                key: "ventas",
                columns: dailyColumns,
                data: dailyExploreData as Record<string, unknown>[],
              },
              {
                label: "Por Campaña",
                key: "campanas",
                columns: campaignColumns,
                data: campaignsExploreData as Record<string, unknown>[],
              },
              {
                label: "Pedidos",
                key: "pedidos",
                columns: ordersColumns,
                data: ordersExploreData as Record<string, unknown>[],
              },
            ]}
            isLoading={isLoadingMain || orderList.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
}
