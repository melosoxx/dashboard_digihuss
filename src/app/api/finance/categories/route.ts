import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const profileId = request.nextUrl.searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    // Get system categories (profile_id IS NULL) + profile custom categories
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .or(`profile_id.is.null,profile_id.eq.${profileId}`)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const categories = (data ?? []).map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      name: row.name,
      slug: row.slug,
      icon: row.icon,
      color: row.color,
      type: row.type,
      sortOrder: row.sort_order,
      isSystem: row.is_system,
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Finance categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense categories" },
      { status: 500 }
    );
  }
}

const createCategorySchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(["fixed", "variable"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { profileId, name, type, icon, color } = parsed.data;
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data, error } = await supabase
      .from("expense_categories")
      .insert({
        profile_id: profileId,
        name,
        slug,
        type,
        icon: icon ?? null,
        color: color ?? "#6b7280",
        is_system: false,
        sort_order: 99,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        id: data.id,
        profileId: data.profile_id,
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        color: data.color,
        type: data.type,
        sortOrder: data.sort_order,
        isSystem: data.is_system,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create expense category" },
      { status: 500 }
    );
  }
}
