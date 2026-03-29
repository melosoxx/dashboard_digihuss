import { NextResponse } from "next/server";
import { constructWebhookEvent, getStripe } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { activateUser, markPaymentFailed, cancelSubscription } from "@/lib/payments/subscription-manager";
import { sendWelcomeEmail, sendPaymentFailedEmail, sendAccountPausedEmail } from "@/lib/email/platform-emails";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("[stripe-webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) break;

        // Save stripe customer ID
        await supabase
          .from("user_profiles")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", userId);

        // Get subscription details from Stripe
        const sub = await getStripe().subscriptions.retrieve(subscriptionId);
        const subData = sub as unknown as {
          items: { data: Array<{ price?: { unit_amount?: number } }> };
          currency: string;
          current_period_end: number;
        };
        const amount = (subData.items.data[0]?.price?.unit_amount ?? 0) / 100;
        const currency = subData.currency.toUpperCase();
        const periodEnd = new Date(subData.current_period_end * 1000);

        await activateUser(
          supabase,
          userId,
          "stripe",
          subscriptionId,
          amount,
          currency,
          periodEnd
        );

        // Send welcome email
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("email, full_name")
          .eq("user_id", userId)
          .single();
        if (profile) {
          await sendWelcomeEmail(profile.email, profile.full_name ?? undefined).catch(console.error);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as { subscription?: string };
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("external_subscription_id", subscriptionId)
          .single();

        if (sub) {
          await markPaymentFailed(supabase, sub.user_id);
          const { data: p } = await supabase
            .from("user_profiles")
            .select("email")
            .eq("user_id", sub.user_id)
            .single();
          if (p) await sendPaymentFailedEmail(p.email).catch(console.error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await cancelSubscription(supabase, userId);
          const { data: p } = await supabase
            .from("user_profiles")
            .select("email")
            .eq("user_id", userId)
            .single();
          if (p) await sendAccountPausedEmail(p.email).catch(console.error);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] Handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
