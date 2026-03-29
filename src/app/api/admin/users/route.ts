import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/supabase/auth-guard";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireSuperadmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("account_status", status);
    }

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,full_name.ilike.%${search}%,company.ilike.%${search}%`
      );
    }

    const { data: users, error } = await query;
    if (error) throw error;

    // Fetch subscriptions for all users
    const userIds = users?.map((u) => u.user_id) ?? [];
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .in("user_id", userIds);

    // Fetch latest onboarding session for each user
    const { data: onboardings } = await supabase
      .from("onboarding_sessions")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    // Combine data
    const usersWithData = users?.map((user) => ({
      ...user,
      subscription: subscriptions?.find((s) => s.user_id === user.user_id) ?? null,
      onboarding: onboardings?.find((o) => o.user_id === user.user_id) ?? null,
    }));

    return NextResponse.json(usersWithData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
