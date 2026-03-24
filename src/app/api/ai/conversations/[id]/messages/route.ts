import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";

// POST /api/ai/conversations/[id]/messages — save a message pair (user + assistant)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const messages: Array<{ role: "user" | "assistant"; content: string }> = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages requeridos" }, { status: 400 });
    }

    // Verify conversation exists and belongs to user (RLS handles this)
    const { data: conv } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("id", id)
      .single();

    if (!conv) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    // Insert messages
    const rows = messages.map((m) => ({
      conversation_id: id,
      role: m.role,
      content: m.content,
    }));

    const { error: insertError } = await supabase
      .from("ai_messages")
      .insert(rows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Touch conversation updated_at
    await supabase
      .from("ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
