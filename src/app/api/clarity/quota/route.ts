import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";

const MAX_CALLS = 10;

// GET /api/clarity/quota?profileId=xxx
// Returns today's quota status for the given profile
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const profileId = request.nextUrl.searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json({
        remaining: MAX_CALLS,
        used: 0,
        max: MAX_CALLS,
        exhausted: false,
        lastFetchAt: null,
      });
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data } = await supabase
      .from("clarity_quota")
      .select("call_count, exhausted_by_api, last_fetch_at")
      .eq("profile_id", profileId)
      .eq("date", today)
      .single();

    if (!data) {
      // No quota row for today - check if there's a last_fetch_at from a previous day
      const { data: prevQuota } = await supabase
        .from("clarity_quota")
        .select("last_fetch_at")
        .eq("profile_id", profileId)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json({
        remaining: MAX_CALLS,
        used: 0,
        max: MAX_CALLS,
        exhausted: false,
        lastFetchAt: prevQuota?.last_fetch_at ?? null,
      });
    }

    const used = data.call_count;
    const remaining = Math.max(0, MAX_CALLS - used);
    const exhausted = data.exhausted_by_api || remaining === 0;

    return NextResponse.json({
      remaining,
      used,
      max: MAX_CALLS,
      exhausted,
      lastFetchAt: data.last_fetch_at,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Clarity quota error:", error);
    return NextResponse.json({
      remaining: MAX_CALLS,
      used: 0,
      max: MAX_CALLS,
      exhausted: false,
      lastFetchAt: null,
    });
  }
}
