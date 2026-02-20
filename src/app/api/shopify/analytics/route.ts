import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveShopifyClient } from "@/lib/credentials";
import { getPreviousPeriod } from "@/lib/date-utils";
import { calculatePercentChange } from "@/lib/utils";

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = querySchema.safeParse({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters. Required: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const client = resolveShopifyClient(request);
    const previousPeriod = getPreviousPeriod(parsed.data);

    const [current, previous, checkoutSessions] = await Promise.all([
      client.getOrdersAggregate(parsed.data.startDate, parsed.data.endDate),
      client.getOrdersAggregate(previousPeriod.startDate, previousPeriod.endDate),
      client.getSessions(parsed.data.startDate, parsed.data.endDate),
    ]);

    // Fetch checkouts after we know orderCount (abandoned + completed)
    const checkoutCount = await client.getCheckouts(
      parsed.data.startDate,
      parsed.data.endDate,
      current.orderCount
    );

    const conversionRate =
      checkoutSessions > 0
        ? (current.orderCount / checkoutSessions) * 100
        : null;

    return NextResponse.json({
      conversionRate,
      checkoutSessions,
      checkoutCount,
      revenueTrend: current.dailyRevenue.map((d) => ({
        date: d.date,
        revenue: d.revenue,
      })),
      orderTrend: current.dailyRevenue.map((d) => ({
        date: d.date,
        count: d.orders,
      })),
      periodComparison: {
        currentPeriodRevenue: current.totalRevenue,
        previousPeriodRevenue: previous.totalRevenue,
        percentChange: calculatePercentChange(
          current.totalRevenue,
          previous.totalRevenue
        ),
      },
    });
  } catch (error) {
    console.error("Shopify analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics from Shopify" },
      { status: 500 }
    );
  }
}
