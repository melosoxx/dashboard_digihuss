import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMPWebhook, getMPSubscription } from "@/lib/payments/mercadopago";
import { activateUser, cancelSubscription } from "@/lib/payments/subscription-manager";
import { sendWelcomeEmail, sendAccountPausedEmail } from "@/lib/email/platform-emails";

export async function POST(request: Request) {
  const body = await request.json();

  // Verify webhook signature
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const dataId = body?.data?.id?.toString() ?? "";

  if (!verifyMPWebhook(xSignature, xRequestId, dataId)) {
    console.error("[mp-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    const { type } = body;

    // Handle subscription (preapproval) events
    if (type === "subscription_preapproval") {
      const preapprovalId = body.data.id;
      const preapproval = await getMPSubscription(preapprovalId);
      const userId = preapproval.external_reference;

      if (!userId) {
        return NextResponse.json({ received: true });
      }

      // Save MP customer ID
      await supabase
        .from("user_profiles")
        .update({ mercadopago_customer_id: preapproval.payer_id?.toString() ?? null })
        .eq("user_id", userId);

      if (preapproval.status === "authorized") {
        const amount = preapproval.auto_recurring?.transaction_amount ?? 0;
        const currency = preapproval.auto_recurring?.currency_id ?? "ARS";

        await activateUser(
          supabase,
          userId,
          "mercadopago",
          preapprovalId,
          amount,
          currency
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
      } else if (preapproval.status === "cancelled") {
        await cancelSubscription(supabase, userId);
        const { data: p } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("user_id", userId)
          .single();
        if (p) await sendAccountPausedEmail(p.email).catch(console.error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[mp-webhook] Handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
