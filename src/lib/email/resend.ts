import "server-only";
import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "WWH Dash <noreply@wwhustle.com>";
