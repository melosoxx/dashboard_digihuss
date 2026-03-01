import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";

const updateExpenseSchema = z.object({
  profileId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceDay: z.number().min(1).max(28).nullable().optional(),
  isGeneral: z.boolean().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.profileId !== undefined)
      updates.profile_id = parsed.data.profileId;
    if (parsed.data.categoryId !== undefined)
      updates.category_id = parsed.data.categoryId;
    if (parsed.data.description !== undefined)
      updates.description = parsed.data.description;
    if (parsed.data.amount !== undefined) updates.amount = parsed.data.amount;
    if (parsed.data.expenseDate !== undefined)
      updates.expense_date = parsed.data.expenseDate;
    if (parsed.data.isRecurring !== undefined)
      updates.is_recurring = parsed.data.isRecurring;
    if (parsed.data.recurrenceDay !== undefined)
      updates.recurrence_day = parsed.data.recurrenceDay;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.isGeneral !== undefined) {
      updates.is_general = parsed.data.isGeneral;
      if (parsed.data.isGeneral) {
        // Recalculate split_among with current active profiles
        const { data: activeProfiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("is_active", true);
        updates.split_among = activeProfiles?.length ?? 1;
      } else {
        updates.split_among = null;
      }
    }

    const { data, error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .select("*, expense_categories(name, slug, color, icon)")
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      profileId: data.profile_id,
      categoryId: data.category_id,
      categoryName: data.expense_categories?.name,
      categorySlug: data.expense_categories?.slug,
      categoryColor: data.expense_categories?.color,
      categoryIcon: data.expense_categories?.icon,
      description: data.description,
      amount: parseFloat(data.amount),
      currency: data.currency,
      expenseDate: data.expense_date,
      source: data.source,
      isRecurring: data.is_recurring,
      recurrenceDay: data.recurrence_day,
      isGeneral: data.is_general ?? false,
      splitAmong: data.split_among ?? null,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { id } = await params;

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
