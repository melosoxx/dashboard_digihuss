import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";

const preferencesSchema = z.object({
  active_profile_id: z.string().uuid().nullable().optional(),
  aggregate_mode: z.boolean().optional(),
  selected_profile_ids: z.array(z.string().uuid()).optional(),
});

// PUT /api/preferences - Update user preferences
export async function PUT(request: Request) {
  try {
    const { supabase, user } = await requireAuth();
    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      ...parsed.data,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Preferences update error:", error);
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  }
}
