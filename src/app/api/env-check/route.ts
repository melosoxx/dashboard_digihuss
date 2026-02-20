import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    shopify: !!(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN),
    meta: !!(process.env.META_AD_ACCOUNT_ID && process.env.META_ACCESS_TOKEN),
    clarity: !!process.env.CLARITY_API_TOKEN,
  });
}
