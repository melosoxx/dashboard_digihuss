import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";
import type { ClarityInsights } from "@/types/clarity";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const { searchParams } = request.nextUrl;
    const profileId = searchParams.get("profileId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!profileId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "profileId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const { data: rows, error } = await supabase
      .from("clarity_daily")
      .select("date, data, fetched_at")
      .eq("profile_id", profileId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("Clarity daily query error:", error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        data: null,
        daysAvailable: 0,
        dailyBreakdown: [],
        dateRange: null,
        lastFetchedAt: null,
      });
    }

    const aggregated = aggregateDailyInsights(
      rows.map((r) => r.data as ClarityInsights)
    );

    return NextResponse.json({
      data: aggregated,
      daysAvailable: rows.length,
      availableDates: rows.map((r) => r.date),
      dailyBreakdown: rows.map((r) => ({
        date: r.date,
        sessions: (r.data as ClarityInsights).traffic.totalSessions,
        users: (r.data as ClarityInsights).traffic.distinctUsers,
      })),
      dateRange: { start: rows[0].date, end: rows[rows.length - 1].date },
      lastFetchedAt: rows[rows.length - 1].fetched_at,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Clarity daily error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function aggregateDailyInsights(days: ClarityInsights[]): ClarityInsights {
  const count = days.length;

  return {
    traffic: {
      totalSessions: days.reduce((s, d) => s + d.traffic.totalSessions, 0),
      botSessions: days.reduce((s, d) => s + d.traffic.botSessions, 0),
      distinctUsers: days.reduce((s, d) => s + d.traffic.distinctUsers, 0),
      pagesPerSession:
        count > 0
          ? days.reduce((s, d) => s + d.traffic.pagesPerSession, 0) / count
          : 0,
    },
    engagement: {
      totalTime: days.reduce((s, d) => s + d.engagement.totalTime, 0),
      activeTime: days.reduce((s, d) => s + d.engagement.activeTime, 0),
    },
    scrollDepth:
      count > 0
        ? days.reduce((s, d) => s + d.scrollDepth, 0) / count
        : 0,
    frustration: {
      deadClicks: days.reduce((s, d) => s + d.frustration.deadClicks, 0),
      rageClicks: days.reduce((s, d) => s + d.frustration.rageClicks, 0),
      quickbacks: days.reduce((s, d) => s + d.frustration.quickbacks, 0),
      errorClicks: days.reduce((s, d) => s + d.frustration.errorClicks, 0),
      scriptErrors: days.reduce((s, d) => s + d.frustration.scriptErrors, 0),
      excessiveScrolls: days.reduce(
        (s, d) => s + d.frustration.excessiveScrolls,
        0
      ),
    },
    topPages: mergeNamedItems(
      days.flatMap((d) => d.topPages),
      "url",
      "visits",
      10
    ) as Array<{ url: string; visits: number }>,
    devices: mergeNamedItems(
      days.flatMap((d) => d.devices),
      "name",
      "sessions",
      5
    ) as Array<{ name: string; sessions: number }>,
    browsers: mergeNamedItems(
      days.flatMap((d) => d.browsers),
      "name",
      "sessions",
      5
    ) as Array<{ name: string; sessions: number }>,
    countries: mergeNamedItems(
      days.flatMap((d) => d.countries),
      "name",
      "sessions",
      10
    ) as Array<{ name: string; sessions: number }>,
  };
}

function mergeNamedItems<T extends Record<string, unknown>>(
  items: T[],
  keyField: string,
  valueField: string,
  limit: number
): T[] {
  const map = new Map<string, number>();

  for (const item of items) {
    const key = String(item[keyField] ?? "");
    const val = Number(item[valueField] ?? 0);
    map.set(key, (map.get(key) ?? 0) + val);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, val]) => ({ [keyField]: key, [valueField]: val }) as T);
}
