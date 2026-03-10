import "server-only";
import { type NextRequest } from "next/server";
import { getShopifyClient, createShopifyClient } from "./shopify";
import { getMetaClient, createMetaClient } from "./meta";
import { getClarityClient, createClarityClient } from "./clarity";
import { createMercadoPagoClient } from "./mercadopago";
import { createAdminClient } from "./supabase/admin";
import { decrypt, encrypt } from "./encryption";
import { isTokenExpired, refreshShopifyToken } from "./shopify-token";

// ----------------------------------------------------------------
// Profile-based credential resolution (Supabase flow)
// ----------------------------------------------------------------

async function getDecryptedCredentials(
  profileId: string,
  service: "shopify" | "meta" | "clarity" | "mercadopago"
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

async function refreshAndPersistShopifyToken(
  profileId: string,
  creds: Record<string, string>
): Promise<string> {
  const { accessToken, expiresAt } = await refreshShopifyToken(
    creds.storeDomain,
    creds.clientId,
    creds.clientSecret
  );

  // Update the stored credentials with the fresh token
  const updated = { ...creds, adminAccessToken: accessToken, tokenExpiresAt: expiresAt };
  const { encrypted, iv } = encrypt(JSON.stringify(updated));

  const supabase = createAdminClient();
  await supabase
    .from("profile_credentials")
    .update({ encrypted_data: encrypted, iv, updated_at: new Date().toISOString() })
    .eq("profile_id", profileId)
    .eq("service", "shopify");

  return accessToken;
}

export async function resolveShopifyClientByProfile(profileId: string) {
  const creds = await getDecryptedCredentials(profileId, "shopify");
  if (!creds || !creds.storeDomain) {
    throw new Error("Shopify credentials not configured for this profile");
  }

  let token = creds.adminAccessToken;

  // Auto-refresh if client credentials are configured and token is expired
  if (creds.clientId && creds.clientSecret) {
    if (!token || isTokenExpired(creds.tokenExpiresAt)) {
      token = await refreshAndPersistShopifyToken(profileId, creds);
    }
  }

  if (!token) {
    throw new Error("Shopify access token not available for this profile");
  }

  return createShopifyClient({
    domain: creds.storeDomain,
    version: creds.adminApiVersion || "2026-01",
    token,
  });
}

export async function resolveMetaClientByProfile(profileId: string) {
  const creds = await getDecryptedCredentials(profileId, "meta");
  if (!creds || !creds.adAccountId || !creds.accessToken) {
    throw new Error("Meta credentials not configured for this profile");
  }

  return createMetaClient({
    accountId: creds.adAccountId,
    token: creds.accessToken,
    version: creds.apiVersion || "v21.0",
  });
}

export async function resolveMetaPromotionsClientByProfile(
  profileId: string
): Promise<{
  client: ReturnType<typeof createMetaClient>;
  domain: string;
  promotionsAdAccountId: string;
} | null> {
  const creds = await getDecryptedCredentials(profileId, "meta");
  if (!creds || !creds.promotionsAdAccountId) return null;

  const token = creds.promotionsAccessToken || creds.accessToken;
  if (!token) return null;

  const client = createMetaClient({
    accountId: creds.promotionsAdAccountId,
    token,
    version: creds.apiVersion || "v21.0",
  });

  return {
    client,
    domain: creds.promotionsDomain || "",
    promotionsAdAccountId: creds.promotionsAdAccountId,
  };
}

export async function resolveClarityClientByProfile(profileId: string) {
  const creds = await getDecryptedCredentials(profileId, "clarity");
  if (!creds || !creds.apiToken) {
    throw new Error("Clarity credentials not configured for this profile");
  }
  if (!creds.projectId) {
    throw new Error("Clarity projectId not configured for this profile");
  }

  return createClarityClient({ token: creds.apiToken });
}

export async function getClarityProjectId(profileId: string): Promise<string> {
  const creds = await getDecryptedCredentials(profileId, "clarity");
  if (!creds?.projectId) {
    throw new Error("Clarity project ID not configured for this profile");
  }
  return creds.projectId;
}

export async function getMpKeywords(profileId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("mp_keywords")
    .eq("id", profileId)
    .single();

  if (error || !data) return [];
  return data.mp_keywords ?? [];
}

export async function resolveMercadoPagoClientByProfile(profileId: string) {
  const creds = await getDecryptedCredentials(profileId, "mercadopago");
  if (!creds || !creds.accessToken) {
    throw new Error("MercadoPago credentials not configured for this profile");
  }

  return createMercadoPagoClient({
    accessToken: creds.accessToken,
  });
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
  return getShopifyClient();
}

export function resolveMetaClient(request: NextRequest) {
  const accountId = request.headers.get("X-Meta-Account-Id");
  const token = request.headers.get("X-Meta-Token");
  const version = request.headers.get("X-Meta-Api-Version") || "v21.0";

  if (accountId && token) {
    return createMetaClient({ accountId, token, version });
  }
  return getMetaClient();
}

export function resolveClarityClient(request: NextRequest) {
  const token = request.headers.get("X-Clarity-Token");

  if (token) {
    return createClarityClient({ token });
  }
  return getClarityClient();
}
