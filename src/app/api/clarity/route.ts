import { NextResponse, type NextRequest } from "next/server";
import { resolveClarityClientByProfile } from "@/lib/credentials";
import { requireAuth } from "@/lib/supabase/auth-guard";

function getTodayArgentina(): string {
  const now = new Date();
  const ar = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  );
  return [
    ar.getFullYear(),
    String(ar.getMonth() + 1).padStart(2, "0"),
    String(ar.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawDays = parseInt(searchParams.get("numOfDays") || "1", 10);
    const numOfDays = ([1, 2, 3] as const).includes(rawDays as 1 | 2 | 3)
      ? (rawDays as 1 | 2 | 3)
      : 1;

    const profileId = searchParams.get("profileId");
    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    const { supabase } = await requireAuth();

    // Resolve client and fetch data
    const client = await resolveClarityClientByProfile(profileId);
    const data = await client.getInsights(numOfDays);
    const now = new Date().toISOString();

    // Save to daily accumulated table (only for single-day fetches)
    if (numOfDays === 1) {
      const todayAR = getTodayArgentina();
      const { error: dailyError } = await supabase
        .from("clarity_daily")
        .upsert(
          {
            profile_id: profileId,
            date: todayAR,
            data: data,
            fetched_at: now,
          },
          { onConflict: "profile_id,date" }
        );

      if (dailyError) {
        console.error("Clarity daily upsert error:", dailyError);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Clarity error:", error);

    const status = (error as Error & { status?: number }).status;
    if (status === 429) {
      return NextResponse.json(
        { error: "Limite diario de Clarity alcanzado. Intenta manana." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Error al obtener datos de Clarity" },
      { status: 500 }
    );
  }
}
