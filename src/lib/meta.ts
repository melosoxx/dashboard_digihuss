import "server-only";
import type {
  MetaRawInsight,
  MetaInsightsResponse,
  MetaAccountInsights,
  MetaDailyMetric,
  MetaCampaignInsight,
} from "@/types/meta";

export interface MetaClientCreds {
  accountId: string;
  token: string;
  version: string;
}

class MetaAdsClient {
  private baseUrl: string;
  private accessToken: string;
  private adAccountId: string;

  constructor(creds?: MetaClientCreds) {
    const version = creds?.version || process.env.META_API_VERSION || "v21.0";
    const token = creds?.token || process.env.META_ACCESS_TOKEN;
    const accountId = creds?.accountId || process.env.META_AD_ACCOUNT_ID;

    if (!token || !accountId) {
      throw new Error("Missing Meta credentials");
    }

    this.baseUrl = `https://graph.facebook.com/${version}`;
    this.accessToken = token;
    this.adAccountId = accountId;
  }

  private extractPurchaseValue(insight: MetaRawInsight): number {
    const pv = insight.action_values?.find(
      (a) => a.action_type === "omni_purchase" || a.action_type === "purchase"
    );
    return pv ? parseFloat(pv.value) : 0;
  }

  private extractROAS(insight: MetaRawInsight): number {
    const purchaseValue = this.extractPurchaseValue(insight);
    const spend = parseFloat(insight.spend);
    if (purchaseValue === 0 || spend === 0) return 0;
    return purchaseValue / spend;
  }

  private extractConversions(insight: MetaRawInsight): number {
    const purchase = insight.actions?.find(
      (a) => a.action_type === "omni_purchase" || a.action_type === "purchase"
    );
    return purchase ? parseInt(purchase.value) : 0;
  }

  async getAccountInsights(startDate: string, endDate: string): Promise<MetaAccountInsights> {
    const params = new URLSearchParams({
      fields: "spend,impressions,clicks,cpc,ctr,actions,action_values,cost_per_action_type",
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      time_increment: "1",
      access_token: this.accessToken,
    });

    const url = `${this.baseUrl}/act_${this.adAccountId}/insights?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status} ${response.statusText}`);
    }

    const json: MetaInsightsResponse = await response.json();
    const dailyInsights = json.data || [];

    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalPurchaseValue = 0;

    const dailyMetrics: MetaDailyMetric[] = dailyInsights.map((day) => {
      const spend = parseFloat(day.spend || "0");
      const impressions = parseInt(day.impressions || "0");
      const clicks = parseInt(day.clicks || "0");
      const roas = this.extractROAS(day);
      const conversions = this.extractConversions(day);
      const purchaseRevenue = this.extractPurchaseValue(day);

      totalSpend += spend;
      totalImpressions += impressions;
      totalClicks += clicks;
      totalConversions += conversions;
      totalPurchaseValue += purchaseRevenue;

      return {
        date: day.date_start,
        spend,
        impressions,
        clicks,
        roas,
        conversions,
        purchaseRevenue,
      };
    });

    return {
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      roas: totalSpend > 0 ? totalPurchaseValue / totalSpend : 0,
      conversions: totalConversions,
      purchaseRevenue: totalPurchaseValue,
      costPerAcquisition: totalConversions > 0 ? totalSpend / totalConversions : 0,
      dailyMetrics,
    };
  }

  async getCampaignInsights(startDate: string, endDate: string): Promise<MetaCampaignInsight[]> {
    const params = new URLSearchParams({
      fields: "campaign_name,campaign_id,spend,impressions,clicks,cpc,ctr,actions,action_values",
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      level: "campaign",
      access_token: this.accessToken,
    });

    const url = `${this.baseUrl}/act_${this.adAccountId}/insights?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status} ${response.statusText}`);
    }

    const json: MetaInsightsResponse = await response.json();

    return (json.data || []).map((row) => ({
      campaignId: row.campaign_id || "",
      campaignName: row.campaign_name || "Unknown",
      spend: parseFloat(row.spend || "0"),
      impressions: parseInt(row.impressions || "0"),
      clicks: parseInt(row.clicks || "0"),
      cpc: parseFloat(row.cpc || "0"),
      ctr: parseFloat(row.ctr || "0"),
      roas: this.extractROAS(row),
      conversions: this.extractConversions(row),
    }));
  }

  async checkConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/act_${this.adAccountId}?fields=name&access_token=${this.accessToken}`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export function createMetaClient(creds: MetaClientCreds): MetaAdsClient {
  return new MetaAdsClient(creds);
}

export const metaClient = new MetaAdsClient();
