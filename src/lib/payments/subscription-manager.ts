import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function activateUser(
  supabase: SupabaseClient,
  userId: string,
  provider: "stripe" | "mercadopago" | "manual",
  externalId: string | null,
  amount: number,
  currency: string,
  periodEnd?: Date
) {
  const now = new Date();
  const end = periodEnd ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Upsert subscription
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (existing) {
    await supabase
      .from("subscriptions")
      .update({
        provider,
        external_subscription_id: externalId,
        status: "active",
        amount,
        currency,
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
        cancelled_at: null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("subscriptions").insert({
      user_id: userId,
      provider,
      external_subscription_id: externalId,
      status: "active",
      plan_name: "standard",
      amount,
      currency,
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
    });
  }

  // Activate account
  await supabase
    .from("user_profiles")
    .update({ account_status: "active" })
    .eq("user_id", userId);
}

export async function markPaymentFailed(supabase: SupabaseClient, userId: string) {
  await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("user_id", userId)
    .eq("status", "active");
}

export async function cancelSubscription(supabase: SupabaseClient, userId: string) {
  await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .in("status", ["active", "past_due"]);

  await supabase
    .from("user_profiles")
    .update({ account_status: "cancelled" })
    .eq("user_id", userId);
}
