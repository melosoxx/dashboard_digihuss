import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveClarityClientByProfile } from "@/lib/credentials";
import type { ClarityInsights } from "@/types/clarity";

export const runtime = "nodejs";

function getArgentinaDate(offset = 0): string {
  const now = new Date();
  const ar = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  );
  ar.setDate(ar.getDate() + offset);
  return [
    ar.getFullYear(),
    String(ar.getMonth() + 1).padStart(2, "0"),
    String(ar.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Decompose a missing day's data from a 2-day aggregate and today's known data.
 * For additive metrics: missing = aggregate - known
 * For averages: weighted by session count
 */
function decomposeMissingDay(
  aggregate: ClarityInsights,
  knownDay: ClarityInsights
): ClarityInsights {
  const sub = (a: number, b: number) => Math.max(0, a - b);
  const missingSessions = sub(aggregate.traffic.totalSessions, knownDay.traffic.totalSessions);

  // Weighted average decomposition: if aggregate = (day1 * w1 + day2 * w2) / (w1 + w2)
  // then day1 = (aggregate * total_w - day2 * w2) / w1
  const totalSessions2d = aggregate.traffic.totalSessions;
  const knownSessions = knownDay.traffic.totalSessions;
  function decomposeAvg(aggVal: number, knownVal: number): number {
    if (missingSessions <= 0) return aggVal;
    const totalWeighted = aggVal * totalSessions2d;
    const knownWeighted = knownVal * knownSessions;
    return Math.max(0, (totalWeighted - knownWeighted) / missingSessions);
  }

  return {
    traffic: {
      totalSessions: missingSessions,
      botSessions: sub(aggregate.traffic.botSessions, knownDay.traffic.botSessions),
      distinctUsers: sub(aggregate.traffic.distinctUsers, knownDay.traffic.distinctUsers),
      pagesPerSession: decomposeAvg(
        aggregate.traffic.pagesPerSession,
        knownDay.traffic.pagesPerSession
      ),
    },
    engagement: {
      totalTime: sub(aggregate.engagement.totalTime, knownDay.engagement.totalTime),
      activeTime: sub(aggregate.engagement.activeTime, knownDay.engagement.activeTime),
    },
    scrollDepth: decomposeAvg(aggregate.scrollDepth, knownDay.scrollDepth),
    frustration: {
      deadClicks: sub(aggregate.frustration.deadClicks, knownDay.frustration.deadClicks),
      rageClicks: sub(aggregate.frustration.rageClicks, knownDay.frustration.rageClicks),
      quickbacks: sub(aggregate.frustration.quickbacks, knownDay.frustration.quickbacks),
      errorClicks: sub(aggregate.frustration.errorClicks, knownDay.frustration.errorClicks),
      scriptErrors: sub(aggregate.frustration.scriptErrors, knownDay.frustration.scriptErrors),
      excessiveScrolls: sub(aggregate.frustration.excessiveScrolls, knownDay.frustration.excessiveScrolls),
    },
    topPages: subtractNamedItems(aggregate.topPages, knownDay.topPages, "url", "visits"),
    devices: subtractNamedItems(aggregate.devices, knownDay.devices, "name", "sessions"),
    browsers: subtractNamedItems(aggregate.browsers, knownDay.browsers, "name", "sessions"),
    countries: subtractNamedItems(aggregate.countries, knownDay.countries, "name", "sessions"),
  };
}

function subtractNamedItems<T extends Record<string, unknown>>(
  aggregate: T[],
  known: T[],
  keyField: string,
  valueField: string
): T[] {
  const knownMap = new Map(
    known.map((item) => [String(item[keyField]), Number(item[valueField] ?? 0)])
  );
  return aggregate
    .map((item) => {
      const key = String(item[keyField]);
      const aggVal = Number(item[valueField] ?? 0);
      const knownVal = knownMap.get(key) ?? 0;
      return { ...item, [valueField]: Math.max(0, aggVal - knownVal) } as T;
    })
    .filter((item) => Number(item[valueField]) > 0);
}

async function handleCron(request: NextRequest) {
  try {
    // Authenticate via CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();
    const supabase = createAdminClient();

    const todayAR = getArgentinaDate(0);
    const yesterdayAR = getArgentinaDate(-1);

    // Query all profiles with valid Clarity credentials
    const { data: clarityProfiles, error: queryError } = await supabase
      .from("profile_credentials")
      .select("profile_id")
      .eq("service", "clarity")
      .in("validation_status", ["valid", "untested"]);

    if (queryError || !clarityProfiles) {
      return NextResponse.json(
        { error: "Failed to query profiles", details: queryError },
        { status: 500 }
      );
    }

    const profileIds = [...new Set(clarityProfiles.map((p) => p.profile_id))];

    if (profileIds.length === 0) {
      return NextResponse.json({ ok: true, date: todayAR, processed: 0 });
    }

    // Process each profile sequentially
    const results: Array<{
      profileId: string;
      success: boolean;
      backfilled?: boolean;
      error?: string;
    }> = [];

    for (const profileId of profileIds) {
      try {
        const client = await resolveClarityClientByProfile(profileId);

        // Fetch today's data
        const todayData = await client.getInsights(1);

        const { error: upsertError } = await supabase
          .from("clarity_daily")
          .upsert(
            {
              profile_id: profileId,
              date: todayAR,
              data: todayData,
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "profile_id,date" }
          );

        if (upsertError) {
          results.push({ profileId, success: false, error: upsertError.message });
          continue;
        }

        // Backfill: check if yesterday is missing
        const { data: yesterdayRow } = await supabase
          .from("clarity_daily")
          .select("date")
          .eq("profile_id", profileId)
          .eq("date", yesterdayAR)
          .maybeSingle();

        if (!yesterdayRow) {
          // Yesterday is missing — try to recover it
          try {
            const twoDayAggregate = await client.getInsights(2);
            const yesterdayData = decomposeMissingDay(twoDayAggregate, todayData);

            // Only store if the decomposed data has meaningful sessions
            if (yesterdayData.traffic.totalSessions > 0) {
              await supabase.from("clarity_daily").upsert(
                {
                  profile_id: profileId,
                  date: yesterdayAR,
                  data: yesterdayData,
                  fetched_at: new Date().toISOString(),
                },
                { onConflict: "profile_id,date" }
              );
              results.push({ profileId, success: true, backfilled: true });
            } else {
              results.push({ profileId, success: true });
            }
          } catch (backfillErr) {
            // Backfill is best-effort; don't fail the whole run
            console.warn(
              `[clarity-cron] Backfill failed for ${profileId}:`,
              (backfillErr as Error).message
            );
            results.push({ profileId, success: true });
          }
        } else {
          results.push({ profileId, success: true });
        }
      } catch (err) {
        results.push({
          profileId,
          success: false,
          error: (err as Error).message,
        });
      }
    }

    const duration = Date.now() - startTime;
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const backfilled = results.filter((r) => r.backfilled).length;

    // Log the cron run
    await supabase.from("clarity_cron_log").insert({
      profiles_processed: profileIds.length,
      profiles_succeeded: succeeded,
      profiles_failed: failed,
      errors: failed > 0 ? results.filter((r) => !r.success) : null,
      duration_ms: duration,
    });

    return NextResponse.json({
      ok: true,
      date: todayAR,
      processed: profileIds.length,
      succeeded,
      failed,
      backfilled,
      duration_ms: duration,
    });
  } catch (error) {
    console.error("Clarity cron error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
