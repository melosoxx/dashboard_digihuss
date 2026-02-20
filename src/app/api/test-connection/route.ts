import { NextResponse, type NextRequest } from "next/server";
import { resolveShopifyClient, resolveMetaClient, resolveClarityClient } from "@/lib/credentials";

export async function POST(request: NextRequest) {
  const results: Record<string, boolean> = {
    shopify: false,
    meta: false,
    clarity: false,
  };

  const tests: Promise<void>[] = [];

  // Test Shopify if headers present
  if (request.headers.get("X-Shopify-Domain") && request.headers.get("X-Shopify-Token")) {
    tests.push(
      (async () => {
        try {
          const client = resolveShopifyClient(request);
          results.shopify = await client.checkConnection();
        } catch {
          results.shopify = false;
        }
      })()
    );
  }

  // Test Meta if headers present
  if (request.headers.get("X-Meta-Account-Id") && request.headers.get("X-Meta-Token")) {
    tests.push(
      (async () => {
        try {
          const client = resolveMetaClient(request);
          results.meta = await client.checkConnection();
        } catch {
          results.meta = false;
        }
      })()
    );
  }

  // Test Clarity if header present
  if (request.headers.get("X-Clarity-Token")) {
    tests.push(
      (async () => {
        try {
          const client = resolveClarityClient(request);
          results.clarity = await client.checkConnection();
        } catch {
          results.clarity = false;
        }
      })()
    );
  }

  await Promise.all(tests);

  return NextResponse.json(results);
}
