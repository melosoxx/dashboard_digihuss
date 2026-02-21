import { NextResponse, type NextRequest } from "next/server";
import {
  resolveShopifyClient,
  resolveMetaClient,
  resolveClarityClient,
  resolveShopifyClientByProfile,
  resolveMetaClientByProfile,
  resolveClarityClientByProfile,
} from "@/lib/credentials";

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const profileId = searchParams.get("profileId");
  const service = searchParams.get("service");

  const results: Record<string, boolean> = {
    shopify: false,
    meta: false,
    clarity: false,
  };

  // If profileId + service specified, test just that service via Supabase credentials
  if (profileId && service) {
    try {
      if (service === "shopify") {
        const client = await resolveShopifyClientByProfile(profileId);
        results.shopify = await client.checkConnection();
      } else if (service === "meta") {
        const client = await resolveMetaClientByProfile(profileId);
        results.meta = await client.checkConnection();
      } else if (service === "clarity") {
        const client = await resolveClarityClientByProfile(profileId);
        results.clarity = await client.checkConnection();
      }
    } catch {
      // Already false
    }
    return NextResponse.json(results);
  }

  // Legacy: test via headers
  const tests: Promise<void>[] = [];

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
