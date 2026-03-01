import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";

const bulkExpenseItemSchema = z.object({
  profileId: z.string().uuid(),
  categoryId: z.string().uuid(),
  description: z.string().min(1).max(200),
  amount: z.number().positive(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).optional(),
});

const bulkExpenseSchema = z.object({
  expenses: z.array(bulkExpenseItemSchema).min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const body = await request.json();
    const parsed = bulkExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const rows = parsed.data.expenses.map((item) => ({
      profile_id: item.profileId,
      category_id: item.categoryId,
      description: item.description,
      amount: item.amount,
      expense_date: item.expenseDate,
      source: "manual" as const,
      is_recurring: false,
      recurrence_day: null,
      notes: item.notes ?? null,
    }));

    const { data, error } = await supabase
      .from("expenses")
      .insert(rows)
      .select("id");

    if (error) throw error;

    return NextResponse.json(
      {
        inserted: data?.length ?? 0,
        errors: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Bulk expense import error:", error);
    return NextResponse.json(
      { error: "Failed to import expenses" },
      { status: 500 }
    );
  }
}
