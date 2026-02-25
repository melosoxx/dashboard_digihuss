import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Build a base query filtered by profile_id.
 * Security is handled by RLS policies.
 */
function baseFilter(
  supabase: SupabaseClient,
  profileId: string
) {
  return supabase.from("clarity_cache").select("*").eq("profile_id", profileId);
}

// GET /api/clarity/cache
// Modes:
//   ?profileId=xxx&numOfDays=3               → latest version for profile
//   ?profileId=xxx&action=list               → list versions for profile
//   ?versionId=uuid                          → specific version by ID
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const { searchParams } = request.nextUrl;
    const profileId = searchParams.get("profileId");
    const action = searchParams.get("action");
    const versionId = searchParams.get("versionId");
    const numOfDays = parseInt(searchParams.get("numOfDays") || "3", 10);

    // MODE: List available versions (lightweight - no data column)
    if (action === "list") {
      if (!profileId) {
        return NextResponse.json({ error: "profileId is required" }, { status: 400 });
      }

      const { data: versions, error } = await baseFilter(supabase, profileId)
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
    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    const { data, error } = await baseFilter(supabase, profileId)
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
