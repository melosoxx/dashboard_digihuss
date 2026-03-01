import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";
import {
  resolveShopifyClientByProfile,
  resolveMetaClientByProfile,
  resolveMercadoPagoClientByProfile,
  getMpKeywords,
} from "@/lib/credentials";
import { filterPaymentsByKeywords, buildMercadoPagoSummary } from "@/lib/mercadopago";
import type { FinanceSummary, MercadoPagoSummary } from "@/types/finance";

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

interface ExpandedExpense {
  date: string;
  amount: number;
  categoryName: string;
  categoryColor: string;
}

/** For general expenses, return amount / split_among; otherwise full amount */
function effectiveAmount(row: { amount: string | number; is_general?: boolean; split_among?: number | null }): number {
  const amt = typeof row.amount === "string" ? parseFloat(row.amount) : row.amount;
  if (row.is_general && row.split_among && row.split_among > 1) {
    return amt / row.split_among;
  }
  return amt;
}

function expandRecurringIntoRange(
  recurringExpenses: Array<{
    amount: string | number;
    recurrence_day: number | null;
    created_at: string;
    is_general?: boolean;
    split_among?: number | null;
    expense_categories: { name: string; color: string } | null;
  }>,
  startDate: string,
  endDate: string
): ExpandedExpense[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const expanded: ExpandedExpense[] = [];

  for (const expense of recurringExpenses) {
    const day = expense.recurrence_day ?? 1;
    const createdMonth = new Date(expense.created_at);
    createdMonth.setDate(1); // Start of creation month

    const rawAmount =
      typeof expense.amount === "string"
        ? parseFloat(expense.amount)
        : expense.amount;
    const amt = effectiveAmount({ amount: rawAmount, is_general: expense.is_general, split_among: expense.split_among });

    let current = new Date(start.getFullYear(), start.getMonth(), day);
    if (current < start) {
      current.setMonth(current.getMonth() + 1);
    }

    while (current <= end) {
      // Only include if the expense existed by this month
      if (current >= createdMonth) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, "0");
        const dd = String(current.getDate()).padStart(2, "0");
        expanded.push({
          date: `${yyyy}-${mm}-${dd}`,
          amount: amt,
          categoryName: expense.expense_categories?.name ?? "Otros Gastos",
          categoryColor: expense.expense_categories?.color ?? "#6b7280",
        });
      }
      current.setMonth(current.getMonth() + 1);
    }
  }

  return expanded;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const { searchParams } = request.nextUrl;

    const parsed = querySchema.safeParse({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters. Required: startDate, endDate" },
        { status: 400 }
      );
    }

    const profileId = searchParams.get("profileId");
    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    const { startDate, endDate } = parsed.data;

    // Fetch user's profile IDs for general expenses
    const { data: userProfiles } = await supabase
      .from("profiles")
      .select("id")
      .order("created_at");
    const allProfileIds = (userProfiles ?? []).map((p) => p.id);
    const generalFilter = `profile_id.eq.${profileId},and(is_general.eq.true,profile_id.in.(${allProfileIds.join(",")}))`;

    // Fetch all data sources in parallel
    const [shopifyResult, metaResult, mpResult, expensesResult, recurringResult] =
      await Promise.allSettled([
        // 1. Shopify revenue
        (async () => {
          const client = await resolveShopifyClientByProfile(profileId);
          return client.getOrdersAggregate(startDate, endDate);
        })(),

        // 2. Meta ad spend
        (async () => {
          const client = await resolveMetaClientByProfile(profileId);
          return client.getAccountInsights(startDate, endDate);
        })(),

        // 3. MercadoPago fees (with keyword filtering)
        (async () => {
          const [client, keywords] = await Promise.all([
            resolveMercadoPagoClientByProfile(profileId),
            getMpKeywords(profileId),
          ]);
          const rawPayments = await client.getPayments(startDate, endDate);
          const filtered = filterPaymentsByKeywords(rawPayments, keywords);
          const accountId = await client.getUserId();
          return buildMercadoPagoSummary(accountId, filtered);
        })(),

        // 4. Manual expenses in range (own + general from any user profile)
        supabase
          .from("expenses")
          .select("*, expense_categories(name, slug, color)")
          .or(generalFilter)
          .eq("is_recurring", false)
          .gte("expense_date", startDate)
          .lte("expense_date", endDate),

        // 5. All recurring expenses (own + general from any user profile)
        supabase
          .from("expenses")
          .select("*, expense_categories(name, slug, color)")
          .or(generalFilter)
          .eq("is_recurring", true),
      ]);

    // Extract results (gracefully handle failures, log errors)
    if (shopifyResult.status === "rejected") {
      console.error("Shopify fetch failed:", shopifyResult.reason);
    }
    if (metaResult.status === "rejected") {
      console.error("Meta fetch failed:", metaResult.reason);
    }
    if (mpResult.status === "rejected") {
      console.error("MercadoPago fetch failed:", mpResult.reason);
    }

    const shopifyData =
      shopifyResult.status === "fulfilled" ? shopifyResult.value : null;
    const metaData =
      metaResult.status === "fulfilled" ? metaResult.value : null;
    const mpData: MercadoPagoSummary | null =
      mpResult.status === "fulfilled" ? mpResult.value : null;
    const manualExpenses =
      expensesResult.status === "fulfilled"
        ? expensesResult.value.data ?? []
        : [];
    const recurringExpenses =
      recurringResult.status === "fulfilled"
        ? recurringResult.value.data ?? []
        : [];

    // Calculate totals
    const grossRevenue = shopifyData?.totalRevenue ?? 0;
    const adSpend = metaData?.spend ?? 0;
    const mpFees = mpData?.totalFees ?? 0;
    const mpNetRevenue = mpData?.netAmount ?? 0;

    const manualTotal = manualExpenses.reduce(
      (sum, e) => sum + effectiveAmount(e),
      0
    );

    const expandedRecurring = expandRecurringIntoRange(
      recurringExpenses,
      startDate,
      endDate
    );
    const recurringTotal = expandedRecurring.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    const totalExpenses = adSpend + manualTotal + recurringTotal;
    const netProfit = mpNetRevenue - totalExpenses;
    const profitMargin = mpNetRevenue > 0 ? (netProfit / mpNetRevenue) * 100 : 0;

    // Build expense breakdown by category
    const categoryMap = new Map<
      string,
      { name: string; color: string; total: number }
    >();

    // Add ad spend
    if (adSpend > 0) {
      categoryMap.set("publicidad", {
        name: "Publicidad (Meta Ads)",
        color: "#f43f5e",
        total: adSpend,
      });
    }

    // Add manual expenses
    for (const expense of manualExpenses) {
      const catName =
        expense.expense_categories?.name ?? "Otros Gastos";
      const catSlug = expense.expense_categories?.slug ?? "otros";
      const catColor = expense.expense_categories?.color ?? "#6b7280";
      const existing = categoryMap.get(catSlug) ?? {
        name: catName,
        color: catColor,
        total: 0,
      };
      existing.total += effectiveAmount(expense);
      categoryMap.set(catSlug, existing);
    }

    // Add recurring expenses
    for (const expense of expandedRecurring) {
      const catName = expense.categoryName;
      const catKey = catName.toLowerCase().replace(/\s+/g, "-");
      const existing = categoryMap.get(catKey) ?? {
        name: catName,
        color: expense.categoryColor,
        total: 0,
      };
      existing.total += expense.amount;
      categoryMap.set(catKey, existing);
    }

    const expensesByCategory = Array.from(categoryMap.values())
      .filter((c) => c.total > 0)
      .map((c) => ({
        categoryName: c.name,
        categoryColor: c.color,
        total: c.total,
        percentage: totalExpenses > 0 ? (c.total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Build daily finance data
    const dailyMap = new Map<
      string,
      {
        revenue: number;
        adSpend: number;
        mpFees: number;
        otherExpenses: number;
      }
    >();

    // Add daily revenue from MercadoPago net
    for (const day of mpData?.dailyPayments ?? []) {
      const date = day.date;
      const existing = dailyMap.get(date) ?? {
        revenue: 0,
        adSpend: 0,
        mpFees: 0,
        otherExpenses: 0,
      };
      existing.revenue += day.net;
      dailyMap.set(date, existing);
    }

    // Add daily ad spend from Meta
    for (const day of metaData?.dailyMetrics ?? []) {
      const date = day.date;
      const existing = dailyMap.get(date) ?? {
        revenue: 0,
        adSpend: 0,
        mpFees: 0,
        otherExpenses: 0,
      };
      existing.adSpend += day.spend;
      dailyMap.set(date, existing);
    }

    // Add daily MP fees
    for (const day of mpData?.dailyPayments ?? []) {
      const date = day.date;
      const existing = dailyMap.get(date) ?? {
        revenue: 0,
        adSpend: 0,
        mpFees: 0,
        otherExpenses: 0,
      };
      existing.mpFees += day.fees;
      dailyMap.set(date, existing);
    }

    // Add manual expenses by date
    for (const expense of manualExpenses) {
      const date = expense.expense_date;
      const existing = dailyMap.get(date) ?? {
        revenue: 0,
        adSpend: 0,
        mpFees: 0,
        otherExpenses: 0,
      };
      existing.otherExpenses += effectiveAmount(expense);
      dailyMap.set(date, existing);
    }

    // Add expanded recurring expenses by date
    for (const expense of expandedRecurring) {
      const existing = dailyMap.get(expense.date) ?? {
        revenue: 0,
        adSpend: 0,
        mpFees: 0,
        otherExpenses: 0,
      };
      existing.otherExpenses += expense.amount;
      dailyMap.set(expense.date, existing);
    }

    const dailyFinance = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        adSpend: data.adSpend,
        mpFees: data.mpFees,
        otherExpenses: data.otherExpenses,
        netProfit:
          data.revenue - data.adSpend - data.otherExpenses,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const summary: FinanceSummary = {
      grossRevenue,
      mpNetRevenue,
      mpFees,
      adSpend,
      manualExpenses: manualTotal,
      recurringExpenses: recurringTotal,
      totalExpenses,
      netProfit,
      profitMargin,
      mpSummary: mpData,
      expensesByCategory,
      dailyFinance,
      serviceStatus: {
        shopify: shopifyResult.status === "fulfilled" ? "ok" : "error",
        meta: metaResult.status === "fulfilled" ? "ok" : "error",
        mercadopago: mpResult.status === "fulfilled" ? "ok" : "error",
      },
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Finance summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch finance summary" },
      { status: 500 }
    );
  }
}
