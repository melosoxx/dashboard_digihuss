import { NextResponse, type NextRequest } from "next/server";
import { resolveClarityClient, resolveClarityClientByProfile } from "@/lib/credentials";
import { requireAuth } from "@/lib/supabase/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const rawDays = parseInt(searchParams.get("numOfDays") || "3", 10);
    const numOfDays = ([1, 2, 3] as const).includes(rawDays as 1 | 2 | 3)
      ? (rawDays as 1 | 2 | 3)
      : 3;

    const profileId = searchParams.get("profileId");

    const { supabase, user } = await requireAuth();

    // Resolve client and fetch data
    const client = profileId
      ? await resolveClarityClientByProfile(profileId)
      : resolveClarityClient(request);

    const data = await client.getInsights(numOfDays);

    // Always save as new version in cache
    const now = new Date().toISOString();
    const { error: cacheError } = await supabase
      .from("clarity_cache")
      .insert({
        user_id: user.id,
        profile_id: profileId || null,
        num_of_days: numOfDays,
        data: data,
        fetched_at: now,
      });

    if (cacheError) {
      console.error("Clarity cache insert error:", cacheError);
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
