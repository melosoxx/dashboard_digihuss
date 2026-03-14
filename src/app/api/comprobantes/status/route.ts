import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";
import type { EmailSendStatusMap } from "@/types/email";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const { searchParams } = request.nextUrl;

    const profileId = searchParams.get("profileId");
    const orderNamesRaw = searchParams.get("orderNames");

    if (!profileId || !orderNamesRaw) {
      return NextResponse.json(
        { error: "Se requiere profileId y orderNames" },
        { status: 400 }
      );
    }

    const orderNames = orderNamesRaw.split(",").map((n) => n.trim()).filter(Boolean);

    if (orderNames.length === 0) {
      return NextResponse.json({} as EmailSendStatusMap);
    }

    const { data, error } = await supabase
      .from("email_send_log")
      .select("shopify_order_name, status, sent_at, error_message")
      .eq("profile_id", profileId)
      .in("shopify_order_name", orderNames)
      .order("sent_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build status map (most recent entry per order)
    const statusMap: EmailSendStatusMap = {};
    for (const row of data ?? []) {
      const name = row.shopify_order_name as string;
      if (!statusMap[name]) {
        statusMap[name] = {
          status: row.status as "sent" | "failed",
          sentAt: row.sent_at as string,
          errorMessage: (row.error_message as string) || undefined,
        };
      }
    }

    return NextResponse.json(statusMap);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Error al consultar estado de envios" },
      { status: 500 }
    );
  }
}
