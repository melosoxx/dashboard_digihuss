import "server-only";
import crypto from "crypto";

const MP_BASE_URL = "https://api.mercadopago.com";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function createMPSubscription({
  email,
  userId,
  amount,
  currency,
  backUrl,
}: {
  email: string;
  userId: string;
  amount: number;
  currency: string;
  backUrl: string;
}) {
  const res = await fetch(`${MP_BASE_URL}/preapproval`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      reason: "WWH Dash - Suscripcion Mensual",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: currency,
      },
      payer_email: email,
      back_url: backUrl,
      external_reference: userId,
      status: "pending",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`MercadoPago error: ${error}`);
  }

  return res.json();
}

export async function getMPSubscription(preapprovalId: string) {
  const res = await fetch(`${MP_BASE_URL}/preapproval/${preapprovalId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch MP subscription");
  return res.json();
}

export function verifyMPWebhook(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  if (!xSignature || !xRequestId) return false;

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;

  // Parse x-signature header: ts=...,v1=...
  const parts: Record<string, string> = {};
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.trim().split("=");
    if (key && value) parts[key] = value;
  });

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return hmac === v1;
}
