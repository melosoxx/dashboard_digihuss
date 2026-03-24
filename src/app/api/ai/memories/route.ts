import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";

const VALID_CATEGORIES = ["negocio", "decisiones", "proyecciones", "preferencias", "general"];

// GET /api/ai/memories — list all memories for the user
export async function GET() {
  try {
    const { supabase } = await requireAuth();

    const { data, error } = await supabase
      .from("ai_memories")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/ai/memories — create a new memory
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireAuth();
    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const category = VALID_CATEGORIES.includes(body.category) ? body.category : "general";

    if (!title || !content) {
      return NextResponse.json({ error: "Título y contenido requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("ai_memories")
      .insert({ user_id: user.id, title, content, category })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
