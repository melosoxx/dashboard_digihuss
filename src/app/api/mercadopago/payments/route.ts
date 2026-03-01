import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveMercadoPagoClientByProfile, getMpKeywords } from "@/lib/credentials";
import { filterPaymentsByKeywords, buildMercadoPagoSummary } from "@/lib/mercadopago";

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

    const profileId = searchParams.get("profileId");
    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    const [client, keywords] = await Promise.all([
      resolveMercadoPagoClientByProfile(profileId),
      getMpKeywords(profileId),
    ]);
    const rawPayments = await client.getPayments(
      parsed.data.startDate,
      parsed.data.endDate
    );
    const filteredPayments = filterPaymentsByKeywords(rawPayments, keywords);
    const accountId = await client.getUserId();
    const data = buildMercadoPagoSummary(accountId, filteredPayments);

    return NextResponse.json(data);
  } catch (error) {
    console.error("MercadoPago payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments from MercadoPago" },
      { status: 500 }
    );
  }
}
