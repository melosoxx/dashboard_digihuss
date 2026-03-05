import { NextResponse } from "next/server";
import { getShopifyClient } from "@/lib/shopify";
import { getMetaClient } from "@/lib/meta";

export async function GET() {
  const [shopifyOk, metaOk] = await Promise.all([
    getShopifyClient().checkConnection(),
    getMetaClient().checkConnection(),
  ]);

  return NextResponse.json({
    shopify: shopifyOk ? "ok" : "error",
    meta: metaOk ? "ok" : "error",
    timestamp: new Date().toISOString(),
  });
}
