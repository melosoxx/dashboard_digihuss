import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOnboardingReminder } from "@/lib/email/platform-emails";

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Find sessions scheduled between 24h and 25h from now
  const { data: sessions, error } = await supabase
    .from("onboarding_sessions")
    .select("*, user_profiles!inner(email, full_name)")
    .eq("status", "scheduled")
    .gte("scheduled_at", in24h.toISOString())
    .lt("scheduled_at", in25h.toISOString());

  if (error) {
    console.error("[onboarding-reminders] Query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const session of sessions ?? []) {
    try {
      const email = (session.user_profiles as { email: string }).email;
      await sendOnboardingReminder(email, new Date(session.scheduled_at));
      sent++;
    } catch (err) {
      console.error("[onboarding-reminders] Send error:", err);
    }
  }

  return NextResponse.json({ sent, total: sessions?.length ?? 0 });
}
