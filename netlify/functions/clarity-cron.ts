import type { Config } from "@netlify/functions";

export default async () => {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_APP_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl || !cronSecret) {
    console.error("Missing URL or CRON_SECRET env vars");
    return new Response("Missing configuration", { status: 500 });
  }

  try {
    const response = await fetch(`${siteUrl}/api/clarity/cron`, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    const data = await response.json();
    console.log("Clarity cron result:", JSON.stringify(data));

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Clarity cron fetch error:", error);
    return new Response("Cron execution failed", { status: 500 });
  }
};

export const config: Config = {
  // 02:59 UTC = 23:59 Argentina (UTC-3)
  schedule: "59 2 * * *",
};
