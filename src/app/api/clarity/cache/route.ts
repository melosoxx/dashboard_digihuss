import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";

// GET /api/clarity/cache?profileId=xxx&numOfDays=3
// Returns cached Clarity data if available
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const { searchParams } = request.nextUrl;
    const profileId = searchParams.get("profileId");
    const numOfDays = parseInt(searchParams.get("numOfDays") || "3", 10);

    if (!profileId) {
      return NextResponse.json({ cached: null });
    }

    const { data } = await supabase
      .from("clarity_cache")
      .select("data, fetched_at")
      .eq("profile_id", profileId)
      .eq("num_of_days", numOfDays)
      .single();

    if (!data) {
      return NextResponse.json({ cached: null });
    }

    return NextResponse.json({
      cached: data.data,
      fetchedAt: data.fetched_at,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Clarity cache error:", error);
    return NextResponse.json({ cached: null });
  }
}
