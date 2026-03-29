import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/supabase/auth-guard";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireSuperadmin();
    const { id } = await params;

    const { data: user, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", id)
      .single();

    if (error) throw error;

    // Get subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get onboarding sessions
    const { data: onboardings } = await supabase
      .from("onboarding_sessions")
      .select("*")
      .eq("user_id", id)
      .order("scheduled_at", { ascending: false });

    // Get business profiles count
    const { count: profilesCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id);

    return NextResponse.json({
      ...user,
      subscription: subscription ?? null,
      onboardings: onboardings ?? [],
      profilesCount: profilesCount ?? 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, userId } = await requireSuperadmin();
    const { id } = await params;
    const body = await request.json();

    const allowedFields = ["account_status", "role", "onboarding_completed"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("user_id", id)
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(supabase, userId, "update_user", id, {
      fields: Object.keys(updates),
      values: updates,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
