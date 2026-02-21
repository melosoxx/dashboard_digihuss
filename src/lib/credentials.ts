import "server-only";
import { type NextRequest } from "next/server";
import { shopifyClient, createShopifyClient } from "./shopify";
import { metaClient, createMetaClient } from "./meta";
import { clarityClient, createClarityClient } from "./clarity";
import { createAdminClient } from "./supabase/admin";
import { decrypt } from "./encryption";

// ----------------------------------------------------------------
// Profile-based credential resolution (Supabase flow)
// ----------------------------------------------------------------

async function getDecryptedCredentials(
  profileId: string,
  service: "shopify" | "meta" | "clarity"
): Promise<Record<string, string> | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profile_credentials")
    .select("encrypted_data, iv")
    .eq("profile_id", profileId)
    .eq("service", service)
    .single();

  if (error || !data) return null;

  try {
    const json = decrypt(data.encrypted_data, data.iv);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function resolveShopifyClientByProfile(profileId: string | null) {
  if (!profileId) return shopifyClient;

  const creds = await getDecryptedCredentials(profileId, "shopify");
  if (!creds || !creds.storeDomain || !creds.adminAccessToken) return shopifyClient;

  return createShopifyClient({
    domain: creds.storeDomain,
    version: creds.adminApiVersion || "2026-01",
    token: creds.adminAccessToken,
  });
}

export async function resolveMetaClientByProfile(profileId: string | null) {
  if (!profileId) return metaClient;

  const creds = await getDecryptedCredentials(profileId, "meta");
  if (!creds || !creds.adAccountId || !creds.accessToken) return metaClient;

  return createMetaClient({
    accountId: creds.adAccountId,
    token: creds.accessToken,
    version: creds.apiVersion || "v21.0",
  });
}

export async function resolveClarityClientByProfile(profileId: string | null) {
  if (!profileId) return clarityClient;

  const creds = await getDecryptedCredentials(profileId, "clarity");
  if (!creds || !creds.apiToken) return clarityClient;

  return createClarityClient({ token: creds.apiToken });
}

export async function getClarityProjectId(profileId: string | null): Promise<string | null> {
  if (!profileId) return process.env.CLARITY_PROJECT_ID ?? null;

  const creds = await getDecryptedCredentials(profileId, "clarity");
  return creds?.projectId ?? process.env.CLARITY_PROJECT_ID ?? null;
}

// ----------------------------------------------------------------
// Legacy header-based resolution (backward compatibility during migration)
// ----------------------------------------------------------------

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
