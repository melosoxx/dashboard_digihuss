import "server-only";
import type {
  MetaRawInsight,
  MetaInsightsResponse,
  MetaAccountInsights,
  MetaDailyMetric,
  MetaCampaignInsight,
  MetaActiveAd,
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

  async getActiveAds(startDate: string, endDate: string): Promise<MetaActiveAd[]> {
    // 1. Get active ads with creation date
    const adsParams = new URLSearchParams({
      fields: "id,name,created_time,campaign{name},adset{name}",
      filtering: JSON.stringify([
        { field: "effective_status", operator: "IN", value: ["ACTIVE"] },
      ]),
      limit: "100",
      access_token: this.accessToken,
    });

    const adsUrl = `${this.baseUrl}/act_${this.adAccountId}/ads?${adsParams}`;
    const adsResponse = await fetch(adsUrl);

    if (!adsResponse.ok) {
      throw new Error(`Meta API error (ads): ${adsResponse.status} ${adsResponse.statusText}`);
    }

    const adsJson: { data: Array<{ id: string; name: string; created_time: string; campaign?: { name: string }; adset?: { name: string } }> } =
      await adsResponse.json();
    const adsMap = new Map(
      (adsJson.data || []).map((ad) => [ad.id, ad])
    );

    if (adsMap.size === 0) return [];

    // 2. Get insights for active ads
    const insightsParams = new URLSearchParams({
      fields: "ad_id,ad_name,campaign_name,adset_name,spend,impressions,clicks,ctr,actions",
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      level: "ad",
      filtering: JSON.stringify([
        { field: "ad.effective_status", operator: "IN", value: ["ACTIVE"] },
      ]),
      limit: "100",
      access_token: this.accessToken,
    });

    const insightsUrl = `${this.baseUrl}/act_${this.adAccountId}/insights?${insightsParams}`;
    const insightsResponse = await fetch(insightsUrl);

    if (!insightsResponse.ok) {
      throw new Error(`Meta API error (ad insights): ${insightsResponse.status} ${insightsResponse.statusText}`);
    }

    const insightsJson: MetaInsightsResponse = await insightsResponse.json();

    // 3. Join ads with their insights
    const result: MetaActiveAd[] = [];

    for (const row of insightsJson.data || []) {
      const adId = row.ad_id ?? "";
      const adMeta = adsMap.get(adId);
      const impressions = parseInt(row.impressions || "0");
      const linkClicks = parseInt(
        row.actions?.find((a) => a.action_type === "link_click")?.value || "0"
      );
      const linkCtr = impressions > 0 ? (linkClicks / impressions) * 100 : 0;

      result.push({
        adId,
        adName: row.ad_name ?? adMeta?.name ?? "Unknown",
        adsetName: row.adset_name ?? adMeta?.adset?.name ?? "",
        campaignName: row.campaign_name ?? adMeta?.campaign?.name ?? "",
        spend: parseFloat(row.spend || "0"),
        impressions,
        clicks: linkClicks,
        ctr: linkCtr,
        createdAt: adMeta?.created_time ?? "",
      });
    }

    // Include active ads with no insights in the period (0 spend/ctr)
    for (const [adId, ad] of adsMap) {
      if (!result.some((r) => r.adId === adId)) {
        result.push({
          adId,
          adName: ad.name,
          adsetName: ad.adset?.name ?? "",
          campaignName: ad.campaign?.name ?? "",
          spend: 0,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          createdAt: ad.created_time,
        });
      }
    }

    return result;
  }

  async checkConnection(): Promise<{
    connected: boolean;
    accountName?: string;
    businessName?: string;
    accountId?: string;
  }> {
    try {
      const url = `${this.baseUrl}/act_${this.adAccountId}?fields=name,account_id,business_name&access_token=${this.accessToken}`;
      const response = await fetch(url);
      if (!response.ok) return { connected: false };
      const data = await response.json();
      return {
        connected: true,
        accountName: data.name,
        businessName: data.business_name,
        accountId: data.account_id,
      };
    } catch {
      return { connected: false };
    }
  }
}

export function createMetaClient(creds: MetaClientCreds): MetaAdsClient {
  return new MetaAdsClient(creds);
}

export const metaClient = new MetaAdsClient();
