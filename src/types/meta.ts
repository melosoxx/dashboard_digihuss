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
  costPerAcquisition: number;
  dailyMetrics: MetaDailyMetric[];
}

export interface MetaDailyMetric {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  roas: number;
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
