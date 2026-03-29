import "server-only";
import { createClient } from "./server";

export type UserRole = "user" | "superadmin";
export type AccountStatus = "pending" | "active" | "paused" | "cancelled";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    throw new Error("Unauthorized");
  }

  const role = (user.app_metadata?.role as UserRole) ?? "user";
  const accountStatus =
    (user.app_metadata?.account_status as AccountStatus) ?? "active";

  return { supabase, user, userId: user.id, role, accountStatus };
}

export async function requireSuperadmin() {
  const auth = await requireAuth();
  if (auth.role !== "superadmin") {
    throw new Error("Forbidden");
  }
  return auth;
}

export async function requireActiveAccount() {
  const auth = await requireAuth();
  if (auth.accountStatus !== "active" && auth.role !== "superadmin") {
    throw new Error("Account suspended");
  }
  return auth;
}
