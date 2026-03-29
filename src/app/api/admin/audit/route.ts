import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/supabase/auth-guard";

export async function GET(request: Request) {
  try {
    const { supabase } = await requireSuperadmin();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    let query = supabase
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq("action", action);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, total: count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
