import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAuditEvent(
  supabase: SupabaseClient,
  adminUserId: string,
  action: string,
  targetUserId?: string | null,
  details?: Record<string, unknown>
) {
  const { error } = await supabase.from("audit_log").insert({
    admin_user_id: adminUserId,
    action,
    target_user_id: targetUserId ?? null,
    details: details ?? {},
  });

  if (error) {
    console.error("[audit_log] Failed to insert:", error.message);
  }
}
