import "server-only";
import { createClient } from "./server";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    throw new Error("Unauthorized");
  }

  return { supabase, user, userId: user.id };
}
