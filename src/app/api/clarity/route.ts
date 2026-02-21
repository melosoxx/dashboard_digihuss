import { NextResponse, type NextRequest } from "next/server";
import { resolveClarityClient, resolveClarityClientByProfile } from "@/lib/credentials";
import { requireAuth } from "@/lib/supabase/auth-guard";
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_CALLS = 10;

async function incrementQuota(
  supabase: SupabaseClient,
  profileId: string,
  today: string,
  now: string
) {
  const { data: existing } = await supabase
    .from("clarity_quota")
    .select("call_count")
    .eq("profile_id", profileId)
    .eq("date", today)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("clarity_quota")
      .update({
        call_count: existing.call_count + 1,
        last_fetch_at: now,
      })
      .eq("profile_id", profileId)
      .eq("date", today);

    if (error) console.error("Clarity quota update error:", error);
  } else {
    const { error } = await supabase.from("clarity_quota").insert({
      profile_id: profileId,
      date: today,
      call_count: 1,
      last_fetch_at: now,
    });

    if (error) console.error("Clarity quota insert error:", error);
  }
}

async function markExhausted(
  supabase: SupabaseClient,
  profileId: string,
  today: string
) {
  // Check if row exists first
  const { data: existing } = await supabase
    .from("clarity_quota")
    .select("call_count")
    .eq("profile_id", profileId)
    .eq("date", today)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("clarity_quota")
      .update({ exhausted_by_api: true })
      .eq("profile_id", profileId)
      .eq("date", today);

    if (error) console.error("Clarity mark exhausted (update) error:", error);
  } else {
    const { error } = await supabase.from("clarity_quota").insert({
      profile_id: profileId,
      date: today,
      call_count: MAX_CALLS,
      exhausted_by_api: true,
    });

    if (error) console.error("Clarity mark exhausted (insert) error:", error);
  }
}

export async function GET(request: NextRequest) {
  let supabase: SupabaseClient | null = null;

  try {
    const { searchParams } = request.nextUrl;
    const rawDays = parseInt(searchParams.get("numOfDays") || "3", 10);
    const numOfDays = ([1, 2, 3] as const).includes(rawDays as 1 | 2 | 3)
      ? (rawDays as 1 | 2 | 3)
      : 3;

    const profileId = searchParams.get("profileId");

    // Authenticate and get supabase client with user context
    const auth = await requireAuth();
    supabase = auth.supabase;
    const today = new Date().toISOString().slice(0, 10);

    // Server-side quota check if profileId is provided
    if (profileId) {
      const { data: quotaRow } = await supabase
        .from("clarity_quota")
        .select("call_count, exhausted_by_api")
        .eq("profile_id", profileId)
        .eq("date", today)
        .single();

      if (quotaRow) {
        if (quotaRow.exhausted_by_api || quotaRow.call_count >= MAX_CALLS) {
          return NextResponse.json(
            { error: "Limite diario de Clarity excedido. Intenta manana." },
            { status: 429 }
          );
        }
      }
    }

    // Resolve client and fetch data
    const client = profileId
      ? await resolveClarityClientByProfile(profileId)
      : resolveClarityClient(request);

    const data = await client.getInsights(numOfDays);

    // Save to cache and update quota if profileId
    if (profileId) {
      const now = new Date().toISOString();

      // Upsert cache
      const { error: cacheError } = await supabase.from("clarity_cache").upsert(
        {
          profile_id: profileId,
          num_of_days: numOfDays,
          data: data,
          fetched_at: now,
        },
        { onConflict: "profile_id,num_of_days" }
      );

      if (cacheError) {
        console.error("Clarity cache upsert error:", cacheError);
      }

      // Increment quota
      await incrementQuota(supabase, profileId, today, now);
    }

    return NextResponse.json(data);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Clarity error:", error);

    // If Clarity API returns 429, mark exhausted in quota
    const status = (error as Error & { status?: number }).status;
    if (status === 429) {
      const profileId = request.nextUrl.searchParams.get("profileId");
      if (profileId && supabase) {
        const today = new Date().toISOString().slice(0, 10);
        try {
          await markExhausted(supabase, profileId, today);
        } catch (e) {
          console.error("Failed to mark exhausted:", e);
        }
      }
      return NextResponse.json(
        { error: "Limite diario de Clarity excedido. Intenta manana." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener datos de Clarity" },
      { status: 500 }
    );
  }
}
