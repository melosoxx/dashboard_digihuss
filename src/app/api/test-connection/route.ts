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
  let metaAccountInfo: { accountName?: string; businessName?: string; accountId?: string } | null = null;
  let errorMessage: string | null = null;

  // Test a specific service using profile credentials
  if (service) {
    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    try {
      if (service === "shopify") {
        const client = await resolveShopifyClientByProfile(profileId);
        results.shopify = await client.checkConnection();
      } else if (service === "meta") {
        const client = await resolveMetaClientByProfile(profileId);
        const metaResult = await client.checkConnection();
        results.meta = metaResult.connected;
        if (metaResult.connected) {
          metaAccountInfo = {
            accountName: metaResult.accountName,
            businessName: metaResult.businessName,
            accountId: metaResult.accountId,
          };
        }
      } else if (service === "clarity") {
        const client = await resolveClarityClientByProfile(profileId);
        results.clarity = await client.checkConnection();
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
    }
    return NextResponse.json({ ...results, metaAccountInfo, error: errorMessage });
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
          const metaResult = await client.checkConnection();
          results.meta = metaResult.connected;
          if (metaResult.connected) {
            metaAccountInfo = {
              accountName: metaResult.accountName,
              businessName: metaResult.businessName,
              accountId: metaResult.accountId,
            };
          }
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

  return NextResponse.json({ ...results, metaAccountInfo });
}
