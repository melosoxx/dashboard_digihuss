import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";
import { resolveMercadoPagoClientByProfile, getMpKeywords } from "@/lib/credentials";
import { PAYMENT_TYPE_LABELS, filterPaymentsByKeywords } from "@/lib/mercadopago";
import type { MpTransaction } from "@/types/finance";

const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
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
    const payments = filterPaymentsByKeywords(rawPayments, keywords);

    const transactions: MpTransaction[] = payments.map((p) => ({
      id: p.id,
      date: p.date_approved ?? p.date_created,
      description: p.description,
      paymentType: PAYMENT_TYPE_LABELS[p.payment_type_id] ?? p.payment_type_id,
      paymentMethod: p.payment_method_id,
      installments: p.installments,
      grossAmount: p.transaction_amount,
      fees: p.fee_details
        .filter((f) => f.fee_payer === "collector")
        .reduce((sum, f) => sum + f.amount, 0),
      netAmount: p.transaction_details.net_received_amount,
      currency: p.currency_id,
    }));

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("MercadoPago payments list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment transactions" },
      { status: 500 }
    );
  }
}
