import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";
import { encrypt } from "@/lib/encryption";

const configSchema = z.object({
  provider: z.enum(["openai", "anthropic"]),
  model: z.string().min(1),
  apiKey: z.string().min(1),
});

// GET /api/ai/config — returns provider + model (never the key)
export async function GET() {
  try {
    const { supabase } = await requireAuth();

    const { data, error } = await supabase
      .from("ai_config")
      .select("provider, model")
      .single();

    if (error || !data) {
      return NextResponse.json({ configured: false });
    }

    return NextResponse.json({
      provider: data.provider,
      model: data.model,
      configured: true,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to read AI config" }, { status: 500 });
  }
}

// PUT /api/ai/config — save or update AI configuration
export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireAuth();
    const body = await request.json();
    const parsed = configSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const { encrypted, iv } = encrypt(parsed.data.apiKey);

    const { error } = await supabase.from("ai_config").upsert(
      {
        user_id: user.id,
        provider: parsed.data.provider,
        model: parsed.data.model,
        encrypted_api_key: encrypted,
        iv,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("AI config save error:", error);
    return NextResponse.json({ error: "Failed to save AI config" }, { status: 500 });
  }
}

// DELETE /api/ai/config — remove AI configuration
export async function DELETE() {
  try {
    const { supabase, user } = await requireAuth();

    const { error } = await supabase
      .from("ai_config")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete AI config" }, { status: 500 });
  }
}
