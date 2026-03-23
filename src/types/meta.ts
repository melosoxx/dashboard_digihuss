export interface MetaAction {
  action_type: string;
  value: string;
}

export interface MetaRawInsight {
  date_start: string;
  date_stop: string;
  spend: string;
  impressions: string;
  clicks: string;
  cpc: string;
  ctr: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
  cost_per_action_type?: MetaAction[];
  campaign_name?: string;
  campaign_id?: string;
  adset_name?: string;
  adset_id?: string;
  ad_name?: string;
  ad_id?: string;
}

export interface MetaInsightsResponse {
  data: MetaRawInsight[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

export interface MetaAccountInsights {
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  roas: number;
  conversions: number;
  purchaseRevenue: number;
  costPerAcquisition: number;
  dailyMetrics: MetaDailyMetric[];
  previousPeriodSpend?: number;
}

export interface MetaDailyMetric {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  roas: number;
  conversions: number;
  purchaseRevenue: number;
}

export interface MetaCampaignInsight {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  roas: number;
  conversions: number;
}

export interface MetaActiveAd {
  adId: string;
  adName: string;
  adsetName: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  createdAt: string;
  thumbnailUrl?: string;
  objectType?: string;
  videoId?: string;
  linkUrl?: string;
  effectiveStatus?: string;
}

export interface MetaAdsetInsight {
  adsetId: string;
  adsetName: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  roas: number;
  conversions: number;
}
