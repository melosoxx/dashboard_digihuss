import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";
import { decrypt } from "@/lib/encryption";

// POST /api/ai/conversations/[id]/generate-title
// Generates a short title from conversation messages using the user's AI provider
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, userId } = await requireAuth();
    const { id } = await params;

    // Get messages for this conversation
    const { data: messages, error: msgError } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(6);

    if (msgError || !messages?.length) {
      return NextResponse.json({ error: "Sin mensajes" }, { status: 400 });
    }

    // Get AI config
    const { data: config } = await supabase
      .from("ai_config")
      .select("provider, model, encrypted_api_key, iv")
      .single();

    if (!config) {
      return NextResponse.json({ error: "AI no configurada" }, { status: 404 });
    }

    let apiKey: string;
    try {
      apiKey = decrypt(config.encrypted_api_key, config.iv);
    } catch {
      return NextResponse.json({ error: "Error de clave" }, { status: 500 });
    }

    // Build a minimal prompt for title generation
    const conversationSnippet = messages
      .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
      .join("\n");

    const titlePrompt = `Generá un título muy corto (máximo 6 palabras) para esta conversación. Solo respondé con el título, sin comillas ni explicación.\n\nConversación:\n${conversationSnippet}`;

    let title: string;

    if (config.provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: titlePrompt }],
          max_tokens: 30,
          temperature: 0.5,
        }),
      });

      if (!res.ok) {
        return NextResponse.json({ error: "Error del proveedor" }, { status: 502 });
      }

      const data = await res.json();
      title = data.choices?.[0]?.message?.content?.trim() || "";
    } else {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          messages: [{ role: "user", content: titlePrompt }],
          max_tokens: 30,
          temperature: 0.5,
        }),
      });

      if (!res.ok) {
        return NextResponse.json({ error: "Error del proveedor" }, { status: 502 });
      }

      const data = await res.json();
      title = data.content?.[0]?.text?.trim() || "";
    }

    if (!title) {
      return NextResponse.json({ error: "No se generó título" }, { status: 500 });
    }

    // Clean up: remove quotes, limit length
    title = title.replace(/^["'«]|["'»]$/g, "").slice(0, 80);

    // Update conversation title
    const { error: updateError } = await supabase
      .from("ai_conversations")
      .update({ title })
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      return NextResponse.json({ error: "Error actualizando título" }, { status: 500 });
    }

    return NextResponse.json({ title });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Generate title error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
