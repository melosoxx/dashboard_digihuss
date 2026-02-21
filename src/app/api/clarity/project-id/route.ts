import { NextResponse, type NextRequest } from "next/server";
import { getClarityProjectId } from "@/lib/credentials";

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId");

  // If profileId provided, get from Supabase
  if (profileId) {
    try {
      const projectId = await getClarityProjectId(profileId);
      return NextResponse.json({ projectId });
    } catch {
      return NextResponse.json({ projectId: null });
    }
  }

  // Fallback: env var
  const projectId = process.env.CLARITY_PROJECT_ID || null;
  return NextResponse.json({ projectId });
}
