import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";

// GET /api/ai/conversations/[id] — get conversation with messages
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { id } = await params;

    const [convResult, msgsResult] = await Promise.all([
      supabase
        .from("ai_conversations")
        .select("id, title, created_at, updated_at")
        .eq("id", id)
        .single(),
      supabase
        .from("ai_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (convResult.error || !convResult.data) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      ...convResult.data,
      messages: msgsResult.data ?? [],
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH /api/ai/conversations/[id] — rename conversation
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 100) : null;

    if (!title) {
      return NextResponse.json({ error: "Título requerido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("ai_conversations")
      .update({ title })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE /api/ai/conversations/[id] — delete conversation (cascades messages)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { id } = await params;

    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
