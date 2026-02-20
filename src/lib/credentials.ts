import "server-only";
import { type NextRequest } from "next/server";
import { shopifyClient, createShopifyClient } from "./shopify";
import { metaClient, createMetaClient } from "./meta";
import { clarityClient, createClarityClient } from "./clarity";

export function resolveShopifyClient(request: NextRequest) {
  const domain = request.headers.get("X-Shopify-Domain");
  const token = request.headers.get("X-Shopify-Token");
  const version = request.headers.get("X-Shopify-Api-Version") || "2024-10";

  if (domain && token) {
    return createShopifyClient({ domain, version, token });
  }
  return shopifyClient;
}

export function resolveMetaClient(request: NextRequest) {
  const accountId = request.headers.get("X-Meta-Account-Id");
  const token = request.headers.get("X-Meta-Token");
  const version = request.headers.get("X-Meta-Api-Version") || "v21.0";

  if (accountId && token) {
    return createMetaClient({ accountId, token, version });
  }
  return metaClient;
}

export function resolveClarityClient(request: NextRequest) {
  const token = request.headers.get("X-Clarity-Token");

  if (token) {
    return createClarityClient({ token });
  }
  return clarityClient;
}
