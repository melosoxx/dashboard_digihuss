import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/supabase/auth-guard";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireSuperadmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("onboarding_sessions")
      .select("*, user_profiles!inner(email, full_name, company)")
      .order("scheduled_at", { ascending: true });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireSuperadmin();
    const body = await request.json();

    const { user_id, scheduled_at, assigned_team_member, notes, calendly_event_id } = body;

    if (!user_id || !scheduled_at) {
      return NextResponse.json({ error: "user_id and scheduled_at are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("onboarding_sessions")
      .insert({
        user_id,
        scheduled_at,
        assigned_team_member: assigned_team_member ?? null,
        notes: notes ?? null,
        calendly_event_id: calendly_event_id ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(supabase, userId, "create_onboarding", user_id, {
      session_id: data.id,
      scheduled_at,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
