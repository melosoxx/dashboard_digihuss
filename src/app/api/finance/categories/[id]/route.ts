import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  icon: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) {
      updates.name = parsed.data.name;
      updates.slug = parsed.data.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (parsed.data.color !== undefined) updates.color = parsed.data.color;
    if (parsed.data.icon !== undefined) updates.icon = parsed.data.icon;

    // Use admin client to bypass RLS (system categories have profile_id = NULL)
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("expense_categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      profileId: data.profile_id,
      name: data.name,
      slug: data.slug,
      icon: data.icon,
      color: data.color,
      type: data.type,
      sortOrder: data.sort_order,
      isSystem: data.is_system,
    });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is authenticated
    await requireAuth();
    const { id } = await params;

    // Use admin client to bypass RLS (system categories have profile_id = NULL
    // which doesn't match any user's RLS policy, causing silent delete failures)
    const admin = createAdminClient();

    const { error } = await admin
      .from("expense_categories")
      .delete()
      .eq("id", id);

    if (error) {
      // FK constraint: category has expenses referencing it
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "No se puede eliminar: hay gastos usando esta categoria. Reasignalos primero." },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
