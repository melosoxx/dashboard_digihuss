import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";

const testSchema = z.object({
  provider: z.enum(["openai", "anthropic"]),
  model: z.string().min(1),
  apiKey: z.string().min(1),
});

// POST /api/ai/test — test an API key before saving
export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = testSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Datos inválidos" }, { status: 400 });
    }

    const { provider, model, apiKey } = parsed.data;

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Responde OK" }],
          max_tokens: 10,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || `Error ${res.status}`;
        return NextResponse.json({ success: false, error: msg });
      }
    } else {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Responde OK" }],
          max_tokens: 10,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || `Error ${res.status}`;
        return NextResponse.json({ success: false, error: msg });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("AI test error:", error);
    return NextResponse.json({ success: false, error: "Error de conexión" }, { status: 500 });
  }
}
