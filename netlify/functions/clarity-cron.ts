import type { Config } from "@netlify/functions";

// 02:59 UTC = 23:59 Argentina (UTC-3, no DST)
export default async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl || !cronSecret) {
    console.error("[clarity-cron] Missing URL or CRON_SECRET env vars");
    return new Response("Missing configuration", { status: 500 });
  }

  console.log(`[clarity-cron] Running at ${new Date().toISOString()} → ${siteUrl}/api/clarity/cron`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000); // 55s timeout

    const response = await fetch(`${siteUrl}/api/clarity/cron`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await response.text();
    console.log(`[clarity-cron] Response ${response.status}: ${text}`);

    return new Response(text, { status: response.status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[clarity-cron] Fetch error: ${msg}`);
    return new Response(`Cron execution failed: ${msg}`, { status: 500 });
  }
};

export const config: Config = {
  schedule: "59 2 * * *",
};
