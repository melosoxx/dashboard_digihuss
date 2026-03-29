import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";

export async function GET() {
  try {
    const { supabase, userId } = await requireAuth();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("account_status, stripe_customer_id, onboarding_completed")
      .eq("user_id", userId)
      .single();

    return NextResponse.json({
      subscription: subscription ?? null,
      accountStatus: profile?.account_status ?? "active",
      hasStripeCustomer: !!profile?.stripe_customer_id,
      onboardingCompleted: profile?.onboarding_completed ?? false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
