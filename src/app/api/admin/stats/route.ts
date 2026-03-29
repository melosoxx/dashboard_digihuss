import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/supabase/auth-guard";
import type { AdminStats } from "@/types/admin";

export async function GET() {
  try {
    const { supabase } = await requireSuperadmin();

    // Fetch all user profiles
    const { data: users, error: usersError } = await supabase
      .from("user_profiles")
      .select("account_status, created_at")
      .neq("role", "superadmin");

    if (usersError) throw usersError;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const totalUsers = users?.length ?? 0;
    const activeUsers = users?.filter((u) => u.account_status === "active").length ?? 0;
    const pausedUsers = users?.filter((u) => u.account_status === "paused").length ?? 0;
    const pendingUsers = users?.filter((u) => u.account_status === "pending").length ?? 0;
    const cancelledUsers = users?.filter((u) => u.account_status === "cancelled").length ?? 0;
    const newUsersThisMonth = users?.filter((u) => u.created_at >= startOfMonth).length ?? 0;

    // Calculate MRR from active subscriptions
    const { data: subs, error: subsError } = await supabase
      .from("subscriptions")
      .select("amount, currency")
      .eq("status", "active");

    if (subsError) throw subsError;

    const mrr = subs?.reduce((sum, s) => sum + Number(s.amount), 0) ?? 0;

    // Upcoming onboardings
    const { count: upcomingOnboardings } = await supabase
      .from("onboarding_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString());

    const stats: AdminStats = {
      totalUsers,
      activeUsers,
      pausedUsers,
      pendingUsers,
      cancelledUsers,
      mrr,
      mrrCurrency: "USD",
      newUsersThisMonth,
      upcomingOnboardings: upcomingOnboardings ?? 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
