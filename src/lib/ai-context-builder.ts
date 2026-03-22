import type { DashboardContext } from "@/types/ai";

interface ShopifyData {
  totalRevenue?: number;
  orderCount?: number;
  averageOrderValue?: number;
  currency?: string;
  dailyRevenue?: Array<{ date: string; revenue: number; orders: number }>;
}

interface MetaData {
  spend?: number;
  impressions?: number;
  clicks?: number;
  cpc?: number;
  ctr?: number;
  roas?: number;
  conversions?: number;
  purchaseRevenue?: number;
  costPerAcquisition?: number;
  dailyMetrics?: Array<{
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    roas: number;
    conversions: number;
    purchaseRevenue: number;
  }>;
}

interface CampaignData {
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  roas: number;
  conversions: number;
}

interface ClarityData {
  totalSessions?: number;
  distinctUsers?: number;
  pagesPerSession?: number;
  scrollDepth?: number;
  activeTime?: number;
  deadClicks?: number;
  rageClicks?: number;
  quickbacks?: number;
  topPages?: Array<{ url: string; visits: number }>;
  devices?: Array<{ name: string; sessions: number }>;
  countries?: Array<{ name: string; sessions: number }>;
}

interface FinanceData {
  grossRevenue?: number;
  netProfit?: number;
  profitMargin?: number;
  adSpend?: number;
  totalExpenses?: number;
  mpFees?: number;
}

export function buildDashboardContext(params: {
  dateRange: { startDate: string; endDate: string };
  profileName: string;
  aggregateMode: boolean;
  shopify?: ShopifyData | null;
  meta?: MetaData | null;
  campaigns?: CampaignData[] | null;
  clarity?: ClarityData | null;
  finance?: FinanceData | null;
}): DashboardContext {
  const ctx: DashboardContext = {
    dateRange: params.dateRange,
    profileName: params.profileName,
    aggregateMode: params.aggregateMode,
  };

  if (params.shopify && params.shopify.totalRevenue != null) {
    ctx.shopify = {
      totalRevenue: params.shopify.totalRevenue ?? 0,
      orderCount: params.shopify.orderCount ?? 0,
      averageOrderValue: params.shopify.averageOrderValue ?? 0,
      currency: params.shopify.currency ?? "ARS",
      dailyRevenue: params.shopify.dailyRevenue ?? [],
    };
  }

  if (params.meta && params.meta.spend != null) {
    ctx.meta = {
      spend: params.meta.spend ?? 0,
      impressions: params.meta.impressions ?? 0,
      clicks: params.meta.clicks ?? 0,
      cpc: params.meta.cpc ?? 0,
      ctr: params.meta.ctr ?? 0,
      roas: params.meta.roas ?? 0,
      conversions: params.meta.conversions ?? 0,
      purchaseRevenue: params.meta.purchaseRevenue ?? 0,
      costPerAcquisition: params.meta.costPerAcquisition ?? 0,
      dailyMetrics: params.meta.dailyMetrics ?? [],
    };
  }

  if (params.campaigns?.length) {
    ctx.campaigns = params.campaigns;
  }

  if (params.clarity && params.clarity.totalSessions != null) {
    ctx.clarity = {
      totalSessions: params.clarity.totalSessions ?? 0,
      distinctUsers: params.clarity.distinctUsers ?? 0,
      pagesPerSession: params.clarity.pagesPerSession ?? 0,
      scrollDepth: params.clarity.scrollDepth ?? 0,
      activeTime: params.clarity.activeTime ?? 0,
      deadClicks: params.clarity.deadClicks ?? 0,
      rageClicks: params.clarity.rageClicks ?? 0,
      quickbacks: params.clarity.quickbacks ?? 0,
      topPages: params.clarity.topPages ?? [],
      devices: params.clarity.devices ?? [],
      countries: params.clarity.countries ?? [],
    };
  }

  if (params.finance && params.finance.grossRevenue != null) {
    ctx.finance = {
      grossRevenue: params.finance.grossRevenue ?? 0,
      netProfit: params.finance.netProfit ?? 0,
      profitMargin: params.finance.profitMargin ?? 0,
      adSpend: params.finance.adSpend ?? 0,
      totalExpenses: params.finance.totalExpenses ?? 0,
      mpFees: params.finance.mpFees ?? 0,
    };
  }

  return ctx;
}
