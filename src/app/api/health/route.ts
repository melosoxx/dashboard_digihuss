import { NextResponse } from "next/server";
import { shopifyClient } from "@/lib/shopify";
import { metaClient } from "@/lib/meta";

export async function GET() {
  const [shopifyOk, metaOk] = await Promise.all([
    shopifyClient.checkConnection(),
    metaClient.checkConnection(),
  ]);

  return NextResponse.json({
    shopify: shopifyOk ? "ok" : "error",
    meta: metaOk ? "ok" : "error",
    timestamp: new Date().toISOString(),
  });
}
