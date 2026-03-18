import "server-only";
import type {
  MetaRawInsight,
  MetaInsightsResponse,
  MetaAccountInsights,
  MetaDailyMetric,
  MetaCampaignInsight,
  MetaActiveAd,
  MetaAdsetInsight,
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
    let accountId = creds?.accountId || process.env.META_AD_ACCOUNT_ID;

    if (!token || !accountId) {
      throw new Error("Missing Meta credentials");
    }

    // Remove 'act_' prefix if it exists since we add it in API calls
    if (accountId.startsWith("act_")) {
      accountId = accountId.substring(4);
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
      let errorDetail = "";
      try {
        const errorBody = await response.json();
        errorDetail = errorBody.error?.message || JSON.stringify(errorBody);
      } catch {
        errorDetail = response.statusText;
      }
      const error = new Error(`Meta API error (account insights): ${response.status} - ${errorDetail}`);
      // Add permission error flag for better handling
      if (response.status === 403 && errorDetail.includes("NOT grant")) {
        (error as any).isPermissionError = true;
      }
      throw error;
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
      filtering: JSON.stringify([
        { field: "campaign.effective_status", operator: "IN", value: ["ACTIVE"] },
      ]),
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

  async getAdsetInsights(startDate: string, endDate: string): Promise<MetaAdsetInsight[]> {
    const params = new URLSearchParams({
      fields: "adset_name,adset_id,campaign_name,spend,impressions,clicks,cpc,ctr,actions,action_values",
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      level: "adset",
      access_token: this.accessToken,
    });

    const url = `${this.baseUrl}/act_${this.adAccountId}/insights?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status} ${response.statusText}`);
    }

    const json: MetaInsightsResponse = await response.json();

    return (json.data || []).map((row) => ({
      adsetId: row.adset_id || "",
      adsetName: row.adset_name || "Unknown",
      campaignName: row.campaign_name || "",
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
    // Try to get active ads with creation date first
    let adsMap = new Map<string, { id: string; name: string; created_time: string; campaign?: { name: string }; adset?: { name: string }; creative?: { thumbnail_url?: string; object_type?: string; video_id?: string; link_url?: string } }>();

    try {
      const adsParams = new URLSearchParams({
        fields: "id,name,created_time,campaign{name},adset{name},creative{thumbnail_url,object_type,video_id,link_url}",
        filtering: JSON.stringify([
          { field: "effective_status", operator: "IN", value: ["ACTIVE"] },
        ]),
        limit: "100",
        access_token: this.accessToken,
      });

      const adsUrl = `${this.baseUrl}/act_${this.adAccountId}/ads?${adsParams}`;
      const adsResponse = await fetch(adsUrl);

      if (adsResponse.ok) {
        const adsJson: { data: Array<{ id: string; name: string; created_time: string; campaign?: { name: string }; adset?: { name: string }; creative?: { thumbnail_url?: string; object_type?: string; video_id?: string; link_url?: string } }> } =
          await adsResponse.json();
        adsMap = new Map(
          (adsJson.data || []).map((ad) => [ad.id, ad])
        );
      }
    } catch (error) {
      // If ads endpoint fails (403 permissions), continue with insights only
      console.warn("Failed to fetch ads metadata, using insights only:", error);
    }

    // Get insights for active ads
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
      let errorDetail = "";
      try {
        const errorBody = await insightsResponse.json();
        errorDetail = errorBody.error?.message || JSON.stringify(errorBody);
      } catch {
        errorDetail = insightsResponse.statusText;
      }
      const error = new Error(`Meta API error (ad insights): ${insightsResponse.status} - ${errorDetail}`);
      // Add permission error flag for better handling
      if (insightsResponse.status === 403 && errorDetail.includes("NOT grant")) {
        (error as any).isPermissionError = true;
      }
      throw error;
    }

    const insightsJson: MetaInsightsResponse = await insightsResponse.json();

    // Build result from insights
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
        conversions: this.extractConversions(row),
        createdAt: adMeta?.created_time ?? new Date().toISOString(),
        thumbnailUrl: adMeta?.creative?.thumbnail_url,
        objectType: adMeta?.creative?.object_type,
        videoId: adMeta?.creative?.video_id,
        linkUrl: adMeta?.creative?.link_url,
      });
    }

    // Include active ads with no insights in the period (only if we have ads metadata)
    if (adsMap.size > 0) {
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
            conversions: 0,
            createdAt: ad.created_time,
            thumbnailUrl: ad.creative?.thumbnail_url,
            objectType: ad.creative?.object_type,
            videoId: ad.creative?.video_id,
            linkUrl: ad.creative?.link_url,
          });
        }
      }
    }

    return result;
  }

  async getAllAds(startDate: string, endDate: string): Promise<MetaActiveAd[]> {
    let adsMap = new Map<string, { id: string; name: string; created_time: string; effective_status: string; campaign?: { name: string }; adset?: { name: string }; creative?: { thumbnail_url?: string; object_type?: string; video_id?: string; link_url?: string } }>();

    try {
      const adsParams = new URLSearchParams({
        fields: "id,name,created_time,effective_status,campaign{name},adset{name},creative{thumbnail_url,object_type,video_id,link_url}",
        limit: "200",
        access_token: this.accessToken,
      });

      const adsUrl = `${this.baseUrl}/act_${this.adAccountId}/ads?${adsParams}`;
      const adsResponse = await fetch(adsUrl);

      if (adsResponse.ok) {
        const adsJson = await adsResponse.json();
        adsMap = new Map(
          (adsJson.data || []).map((ad: any) => [ad.id, ad])
        );
      }
    } catch (error) {
      console.warn("Failed to fetch all ads metadata:", error);
    }

    const insightsParams = new URLSearchParams({
      fields: "ad_id,ad_name,campaign_name,adset_name,spend,impressions,clicks,ctr,actions",
      time_range: JSON.stringify({ since: startDate, until: endDate }),
      level: "ad",
      limit: "200",
      access_token: this.accessToken,
    });

    const insightsUrl = `${this.baseUrl}/act_${this.adAccountId}/insights?${insightsParams}`;
    const insightsResponse = await fetch(insightsUrl);

    if (!insightsResponse.ok) {
      let errorDetail = "";
      try {
        const errorBody = await insightsResponse.json();
        errorDetail = errorBody.error?.message || JSON.stringify(errorBody);
      } catch {
        errorDetail = insightsResponse.statusText;
      }
      const error = new Error(`Meta API error (all ad insights): ${insightsResponse.status} - ${errorDetail}`);
      if (insightsResponse.status === 403 && errorDetail.includes("NOT grant")) {
        (error as any).isPermissionError = true;
      }
      throw error;
    }

    const insightsJson: MetaInsightsResponse = await insightsResponse.json();

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
        conversions: this.extractConversions(row),
        createdAt: adMeta?.created_time ?? new Date().toISOString(),
        thumbnailUrl: adMeta?.creative?.thumbnail_url,
        objectType: adMeta?.creative?.object_type,
        videoId: adMeta?.creative?.video_id,
        linkUrl: adMeta?.creative?.link_url,
        effectiveStatus: adMeta?.effective_status ?? "UNKNOWN",
      });
    }

    if (adsMap.size > 0) {
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
            conversions: 0,
            createdAt: ad.created_time,
            thumbnailUrl: ad.creative?.thumbnail_url,
            objectType: ad.creative?.object_type,
            videoId: ad.creative?.video_id,
            linkUrl: ad.creative?.link_url,
            effectiveStatus: ad.effective_status ?? "UNKNOWN",
          });
        }
      }
    }

    return result;
  }

  async getVideoSource(videoId: string): Promise<string | null> {
    const url = `${this.baseUrl}/${videoId}?fields=source&access_token=${this.accessToken}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.source || null;
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
      if (!response.ok) {
        let errorDetail = "";
        try {
          const errorBody = await response.json();
          errorDetail = errorBody.error?.message || JSON.stringify(errorBody);
        } catch {
          errorDetail = response.statusText;
        }
        throw new Error(`Meta API error: ${response.status} - ${errorDetail}`);
      }
      const data = await response.json();
      return {
        connected: true,
        accountName: data.name,
        businessName: data.business_name,
        accountId: data.account_id,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to connect to Meta");
    }
  }
}

export function createMetaClient(creds: MetaClientCreds): MetaAdsClient {
  return new MetaAdsClient(creds);
}

let _metaClient: MetaAdsClient | null = null;

export function getMetaClient(): MetaAdsClient {
  if (!_metaClient) {
    _metaClient = new MetaAdsClient();
  }
  return _metaClient;
}
