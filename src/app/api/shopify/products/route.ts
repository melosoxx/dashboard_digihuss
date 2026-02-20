import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveShopifyClient } from "@/lib/credentials";

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = querySchema.safeParse({
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      limit: searchParams.get("limit") ?? 10,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters. Required: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const client = resolveShopifyClient(request);
    const topProducts = await client.getTopProducts(
      parsed.data.startDate,
      parsed.data.endDate,
      parsed.data.limit
    );

    return NextResponse.json({ topProducts });
  } catch (error) {
    console.error("Shopify products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products from Shopify" },
      { status: 500 }
    );
  }
}
