import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/supabase/auth-guard";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const { supabase } = await requireSuperadmin();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*, user_profiles!inner(email, full_name, company)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Manual subscription creation (for bank transfer clients)
export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireSuperadmin();
    const body = await request.json();

    const { user_id, amount, currency = "USD" } = body;

    if (!user_id || !amount) {
      return NextResponse.json({ error: "user_id and amount are required" }, { status: 400 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id,
        provider: "manual",
        status: "active",
        plan_name: "standard",
        amount,
        currency,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Activate the user's account
    await supabase
      .from("user_profiles")
      .update({ account_status: "active" })
      .eq("user_id", user_id);

    await logAuditEvent(supabase, userId, "manual_activate", user_id, {
      amount,
      currency,
      subscription_id: data.id,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
