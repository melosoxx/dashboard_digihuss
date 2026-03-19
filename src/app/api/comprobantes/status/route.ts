import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";
import type { EmailSendStatusMap } from "@/types/email";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const { searchParams } = request.nextUrl;

    // Support both singular profileId and plural profileIds (comma-separated)
    const singleProfileId = searchParams.get("profileId");
    const multiProfileIds = searchParams.get("profileIds");
    const orderNamesRaw = searchParams.get("orderNames");

    let profileIds: string[];
    const isMultiProfile = !!multiProfileIds;

    if (multiProfileIds) {
      profileIds = multiProfileIds.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (singleProfileId) {
      profileIds = [singleProfileId];
    } else {
      return NextResponse.json(
        { error: "Se requiere profileId o profileIds, y orderNames" },
        { status: 400 }
      );
    }

    if (!orderNamesRaw || profileIds.length === 0) {
      return NextResponse.json(
        { error: "Se requiere profileId(s) y orderNames" },
        { status: 400 }
      );
    }

    const orderNames = orderNamesRaw.split(",").map((n) => n.trim()).filter(Boolean);

    if (orderNames.length === 0) {
      return NextResponse.json({} as EmailSendStatusMap);
    }

    const { data, error } = await supabase
      .from("email_send_log")
      .select("profile_id, shopify_order_name, status, sent_at, error_message")
      .in("profile_id", profileIds)
      .in("shopify_order_name", orderNames)
      .order("sent_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build status map (most recent entry per order)
    // Multi-profile: composite key "profileId:orderName" to avoid collisions
    // Single-profile: plain orderName for backwards compatibility
    const statusMap: EmailSendStatusMap = {};
    for (const row of data ?? []) {
      const orderName = row.shopify_order_name as string;
      const pid = row.profile_id as string;
      const key = isMultiProfile ? `${pid}:${orderName}` : orderName;
      if (!statusMap[key]) {
        statusMap[key] = {
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
