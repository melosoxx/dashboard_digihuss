import { NextRequest, NextResponse } from "next/server";
import { resolveMetaClientByProfile } from "@/lib/credentials";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const videoId = searchParams.get("videoId");
    const profileId = searchParams.get("profileId");

    if (!videoId || !profileId) {
      return NextResponse.json(
        { error: "videoId and profileId are required" },
        { status: 400 }
      );
    }

    const client = await resolveMetaClientByProfile(profileId);
    const source = await client.getVideoSource(videoId);

    return NextResponse.json({ source });
  } catch (error: any) {
    console.error("Meta video source error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video source from Meta" },
      { status: 500 }
    );
  }
}
