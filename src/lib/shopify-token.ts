import "server-only";

const TOKEN_SAFETY_MARGIN_MS = 5 * 60 * 1000; // 5 minutes

export function isTokenExpired(tokenExpiresAt?: string): boolean {
  if (!tokenExpiresAt) return true;
  const expiresAt = new Date(tokenExpiresAt).getTime();
  return Date.now() >= expiresAt - TOKEN_SAFETY_MARGIN_MS;
}

export async function refreshShopifyToken(
  storeDomain: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresAt: string }> {
  const url = `https://${storeDomain}/admin/oauth/access_token`;
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(`${url}?${params}`, { method: "POST" });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Shopify token refresh failed: ${response.status} ${response.statusText} — ${body}`
    );
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error("Shopify token refresh: no access_token in response");
  }

  // expires_in is in seconds; subtract 5 min for safety margin
  const expiresInMs = (data.expires_in ?? 86399) * 1000;
  const expiresAt = new Date(
    Date.now() + expiresInMs - TOKEN_SAFETY_MARGIN_MS
  ).toISOString();

  return { accessToken: data.access_token, expiresAt };
}
