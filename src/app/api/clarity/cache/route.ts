import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Build a base query filtered by user_id and optionally profile_id.
 * When profileId is null we match rows where profile_id IS NULL (default profile).
 */
function baseFilter(
  supabase: SupabaseClient,
  userId: string,
  profileId: string | null
) {
  let q = supabase.from("clarity_cache").select("*").eq("user_id", userId);
  if (profileId) {
    q = q.eq("profile_id", profileId);
  } else {
    q = q.is("profile_id", null);
  }
  return q;
}

// GET /api/clarity/cache
// Modes:
//   ?numOfDays=3                             → latest version (default profile)
//   ?profileId=xxx&numOfDays=3               → latest version (custom profile)
//   ?numOfDays=3&action=list                 → list versions
//   ?versionId=uuid                          → specific version by ID
export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireAuth();
    const { searchParams } = request.nextUrl;
    const profileId = searchParams.get("profileId");
    const action = searchParams.get("action");
    const versionId = searchParams.get("versionId");
    const numOfDays = parseInt(searchParams.get("numOfDays") || "3", 10);

    // MODE: List available versions (lightweight - no data column)
    if (action === "list") {
      const { data: versions, error } = await baseFilter(supabase, user.id, profileId)
        .select("id, fetched_at, num_of_days")
        .order("fetched_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Clarity versions list error:", error);
        return NextResponse.json({ versions: [] });
      }

      return NextResponse.json({
        versions: (versions ?? []).map((v) => ({
          id: v.id,
          fetchedAt: v.fetched_at,
          numOfDays: v.num_of_days,
        })),
      });
    }

    // MODE: Fetch specific version by ID
    if (versionId) {
      const { data, error } = await supabase
        .from("clarity_cache")
        .select("id, data, fetched_at")
        .eq("id", versionId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        return NextResponse.json({ cached: null, fetchedAt: null, versionId: null });
      }

      return NextResponse.json({
        cached: data.data,
        fetchedAt: data.fetched_at,
        versionId: data.id,
      });
    }

    // MODE: Fetch latest version (default)
    const { data, error } = await baseFilter(supabase, user.id, profileId)
      .select("id, data, fetched_at")
      .eq("num_of_days", numOfDays)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ cached: null, fetchedAt: null, versionId: null });
    }

    return NextResponse.json({
      cached: data.data,
      fetchedAt: data.fetched_at,
      versionId: data.id,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Clarity cache error:", error);
    return NextResponse.json({ cached: null, fetchedAt: null, versionId: null });
  }
}
