import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveMetaClientByProfile } from "@/lib/credentials";

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

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
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }
    const client = await resolveMetaClientByProfile(profileId);

    const campaigns = await client.getCampaignInsights(
      parsed.data.startDate,
      parsed.data.endDate
    );

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error("Meta campaigns error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign insights from Meta" },
      { status: 500 }
    );
  }
}
