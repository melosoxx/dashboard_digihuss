import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveMetaPromotionsClientByProfile } from "@/lib/credentials";
import type { MetaAccountInsights, MetaActiveAd } from "@/types/meta";

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const emptyInsights: MetaAccountInsights = {
  spend: 0,
  impressions: 0,
  clicks: 0,
  cpc: 0,
  ctr: 0,
  roas: 0,
  conversions: 0,
  purchaseRevenue: 0,
  costPerAcquisition: 0,
  dailyMetrics: [],
};

function isInstagramPromotion(campaignName: string): boolean {
  const lower = campaignName.toLowerCase();
  return lower.startsWith("publicación") || lower.startsWith("instagram post:");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = querySchema.safeParse({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters. Required: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const profileId = searchParams.get("profileId");
    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    // If aggregate=true, skip domain filtering (show all promotions)
    const aggregate = searchParams.get("aggregate") === "true";

    const resolved = await resolveMetaPromotionsClientByProfile(profileId);
    if (!resolved) {
      return NextResponse.json({ configured: false, insights: emptyInsights, ads: [] });
    }

    const { client, domain } = resolved;
    const { startDate, endDate } = parsed.data;

    // Fetch insights and active ads in parallel
    const [insights, ads] = await Promise.all([
      client.getAccountInsights(startDate, endDate),
      client.getAllAds(startDate, endDate).catch(() => [] as MetaActiveAd[]),
    ]);

    // Filter to only include Instagram promotions (boosted posts)
    let filteredAds = ads.filter((ad) => isInstagramPromotion(ad.campaignName));

    // Additionally filter by domain when not in aggregate mode
    if (!aggregate && domain) {
      filteredAds = filteredAds.filter(
        (ad) => ad.linkUrl && ad.linkUrl.toLowerCase().includes(domain.toLowerCase())
      );
    }

    // Recalculate insights from filtered promotion ads
    const spend = filteredAds.reduce((s, a) => s + a.spend, 0);
    const impressions = filteredAds.reduce((s, a) => s + a.impressions, 0);
    const clicks = filteredAds.reduce((s, a) => s + a.clicks, 0);
    const conversions = filteredAds.reduce((s, a) => s + a.conversions, 0);

    const filteredInsights: MetaAccountInsights = {
      spend,
      impressions,
      clicks,
      cpc: clicks > 0 ? spend / clicks : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      roas: 0,
      conversions,
      purchaseRevenue: 0,
      costPerAcquisition: conversions > 0 ? spend / conversions : 0,
      dailyMetrics: [],
    };

    return NextResponse.json({
      configured: true,
      promotionsAdAccountId: resolved.promotionsAdAccountId,
      insights: filteredInsights,
      ads: filteredAds,
    });
  } catch (error: any) {
    console.error("Meta promotions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotions from Meta", details: error.message || String(error) },
      { status: 500 }
    );
  }
}
