import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/supabase/auth-guard";
import { logAuditEvent } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, userId } = await requireSuperadmin();
    const { id } = await params;
    const body = await request.json();

    const allowedFields = ["status", "assigned_team_member", "notes", "completed_at"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Auto-set completed_at when marking as completed
    if (updates.status === "completed" && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("onboarding_sessions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Mark onboarding as completed on user profile
    if (updates.status === "completed") {
      await supabase
        .from("user_profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", data.user_id);
    }

    await logAuditEvent(supabase, userId, "update_onboarding", data.user_id, {
      session_id: id,
      updates,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
