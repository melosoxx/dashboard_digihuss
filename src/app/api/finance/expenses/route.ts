import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const { searchParams } = request.nextUrl;
    const profileId = searchParams.get("profileId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    // Fetch user's profile IDs for general expenses
    const { data: userProfiles } = await supabase
      .from("profiles")
      .select("id")
      .order("created_at");
    const allProfileIds = (userProfiles ?? []).map((p) => p.id);

    // Include this profile's expenses AND general expenses from any of the user's profiles
    let query = supabase
      .from("expenses")
      .select("*, expense_categories(name, slug, color, icon)")
      .or(`profile_id.eq.${profileId},and(is_general.eq.true,profile_id.in.(${allProfileIds.join(",")}))`)
      .order("expense_date", { ascending: false });

    if (startDate) query = query.gte("expense_date", startDate);
    if (endDate) query = query.lte("expense_date", endDate);

    const { data, error } = await query;
    if (error) throw error;

    const expenses = (data ?? []).map((row) => ({
      id: row.id,
      profileId: row.profile_id,
      categoryId: row.category_id,
      categoryName: row.expense_categories?.name,
      categorySlug: row.expense_categories?.slug,
      categoryColor: row.expense_categories?.color,
      categoryIcon: row.expense_categories?.icon,
      description: row.description,
      amount: parseFloat(row.amount),
      currency: row.currency,
      expenseDate: row.expense_date,
      source: row.source,
      isRecurring: row.is_recurring,
      recurrenceDay: row.recurrence_day,
      isGeneral: row.is_general ?? false,
      splitAmong: row.split_among ?? null,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Finance expenses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

const createExpenseSchema = z.object({
  profileId: z.string().uuid(),
  categoryId: z.string().uuid(),
  description: z.string().min(1).max(200),
  amount: z.number().positive(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isRecurring: z.boolean().optional().default(false),
  recurrenceDay: z.number().min(1).max(28).optional(),
  isGeneral: z.boolean().optional().default(false),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      profileId,
      categoryId,
      description,
      amount,
      expenseDate,
      isRecurring,
      recurrenceDay,
      isGeneral,
      notes,
    } = parsed.data;

    // Build insert object
    const insertData: Record<string, unknown> = {
      profile_id: profileId,
      category_id: categoryId,
      description,
      amount,
      expense_date: expenseDate,
      source: "manual",
      is_recurring: isRecurring,
      recurrence_day: isRecurring ? (recurrenceDay ?? 1) : null,
      notes: notes ?? null,
    };

    // Only include general expense fields when actually creating a general expense
    // (columns may not exist until migration is run)
    if (isGeneral) {
      const { data: activeProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_active", true);
      insertData.is_general = true;
      insertData.split_among = activeProfiles?.length ?? 1;
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert(insertData)
      .select("*, expense_categories(name, slug, color, icon)")
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
