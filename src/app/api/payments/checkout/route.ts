import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";
import { createCheckoutSession } from "@/lib/payments/stripe";
import { createMPSubscription } from "@/lib/payments/mercadopago";

export async function POST(request: Request) {
  try {
    const { userId, user } = await requireAuth();
    const body = await request.json();
    const { provider } = body;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (provider === "stripe") {
      const priceId = process.env.STRIPE_PRICE_ID;
      if (!priceId) {
        return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
      }

      const session = await createCheckoutSession({
        userId,
        email: user.email!,
        priceId,
        successUrl: `${appUrl}/panel?payment=success`,
        cancelUrl: `${appUrl}/panel?payment=cancelled`,
      });

      return NextResponse.json({ url: session.url });
    }

    if (provider === "mercadopago") {
      const amount = body.amount;
      const currency = body.currency ?? "ARS";

      if (!amount) {
        return NextResponse.json({ error: "amount is required for MercadoPago" }, { status: 400 });
      }

      const subscription = await createMPSubscription({
        email: user.email!,
        userId,
        amount,
        currency,
        backUrl: `${appUrl}/panel?payment=mp_callback`,
      });

      return NextResponse.json({ url: subscription.init_point });
    }

    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
