import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// GET /api/profiles - List user profiles with preferences
export async function GET() {
  try {
    const { supabase, user } = await requireAuth();

    const [profilesResult, prefsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, color, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("user_preferences")
        .select("active_profile_id, aggregate_mode, selected_profile_ids")
        .eq("user_id", user.id)
        .single(),
    ]);

    // Check which services are configured per profile
    const profileIds = (profilesResult.data ?? []).map((p) => p.id);
    const { data: credRows } = await supabase
      .from("profile_credentials")
      .select("profile_id, service")
      .in("profile_id", profileIds.length > 0 ? profileIds : ["__none__"]);

    const configuredServices = new Map<string, Set<string>>();
    for (const row of credRows ?? []) {
      if (!configuredServices.has(row.profile_id)) {
        configuredServices.set(row.profile_id, new Set());
      }
      configuredServices.get(row.profile_id)!.add(row.service);
    }

    const profiles = (profilesResult.data ?? []).map((p) => ({
      ...p,
      configuredServices: Array.from(configuredServices.get(p.id) ?? []),
    }));

    const preferences = prefsResult.data ?? {
      active_profile_id: null,
      aggregate_mode: false,
      selected_profile_ids: [],
    };

    return NextResponse.json({ profiles, preferences });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Profiles list error:", error);
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
  }
}

// POST /api/profiles - Create new profile
export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireAuth();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        color: parsed.data.color ?? "#3b82f6",
      })
      .select("id, name, color, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Set as active profile
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      active_profile_id: data.id,
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Profile create error:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
