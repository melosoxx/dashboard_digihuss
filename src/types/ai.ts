export type AIProvider = "openai" | "anthropic";

export interface AIConfig {
  provider: AIProvider;
  model?: string;
  configured: boolean;
}

export interface DashboardContext {
  dateRange: { startDate: string; endDate: string };
  profileName: string;
  aggregateMode: boolean;
  shopify?: {
    totalRevenue: number;
    orderCount: number;
    averageOrderValue: number;
    currency: string;
    dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  };
  meta?: {
    spend: number;
    impressions: number;
    clicks: number;
    cpc: number;
    ctr: number;
    roas: number;
    conversions: number;
    purchaseRevenue: number;
    costPerAcquisition: number;
    dailyMetrics: Array<{
      date: string;
      spend: number;
      impressions: number;
      clicks: number;
      roas: number;
      conversions: number;
      purchaseRevenue: number;
    }>;
  };
  campaigns?: Array<{
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    roas: number;
    conversions: number;
  }>;
  clarity?: {
    totalSessions: number;
    distinctUsers: number;
    pagesPerSession: number;
    scrollDepth: number;
    activeTime: number;
    deadClicks: number;
    rageClicks: number;
    quickbacks: number;
    topPages: Array<{ url: string; visits: number }>;
    devices: Array<{ name: string; sessions: number }>;
    countries: Array<{ name: string; sessions: number }>;
  };
  finance?: {
    grossRevenue: number;
    netProfit: number;
    profitMargin: number;
    adSpend: number;
    totalExpenses: number;
    mpFees: number;
  };
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIChatRequest {
  question: string;
  context: DashboardContext;
  history?: AIChatMessage[];
}

export interface AIConfigResponse {
  provider: AIProvider;
  model: string;
  configured: boolean;
}

export const AI_MODELS: Record<AIProvider, Array<{ id: string; label: string }>> = {
  openai: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    { id: "gpt-4.1", label: "GPT-4.1" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { id: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
};
