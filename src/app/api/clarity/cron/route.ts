import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveClarityClientByProfile } from "@/lib/credentials";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Authenticate via CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.CRON_SECRET;
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();
    const supabase = createAdminClient();

    // Get today's date in Argentina time (UTC-3)
    const now = new Date();
    const argentinaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
    );
    const todayAR = [
      argentinaTime.getFullYear(),
      String(argentinaTime.getMonth() + 1).padStart(2, "0"),
      String(argentinaTime.getDate()).padStart(2, "0"),
    ].join("-");

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
      error?: string;
    }> = [];

    for (const profileId of profileIds) {
      try {
        const client = await resolveClarityClientByProfile(profileId);
        const data = await client.getInsights(1);

        const { error: upsertError } = await supabase
          .from("clarity_daily")
          .upsert(
            {
              profile_id: profileId,
              date: todayAR,
              data: data,
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "profile_id,date" }
          );

        if (upsertError) {
          results.push({
            profileId,
            success: false,
            error: upsertError.message,
          });
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
