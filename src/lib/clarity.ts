import "server-only";
import type { ClarityInsights } from "@/types/clarity";

interface ClarityMetric {
  metricName: string;
  information: Record<string, unknown>[];
}

export interface ClarityClientCreds {
  token: string;
}

class ClarityClient {
  private endpoint = "https://www.clarity.ms/export-data/api/v1/project-live-insights";
  private token: string;

  constructor(creds?: ClarityClientCreds) {
    const token = creds?.token || process.env.CLARITY_API_TOKEN;
    if (!token) {
      throw new Error("Missing Clarity credentials");
    }
    this.token = token;
  }

  private async fetchMetrics(numOfDays: 1 | 2 | 3, dimension1?: string): Promise<ClarityMetric[]> {
    const params = new URLSearchParams({ numOfDays: String(numOfDays) });
    if (dimension1) params.set("dimension1", dimension1);

    const response = await fetch(`${this.endpoint}?${params}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("Clarity error details:", { status: response.status, body });
      const err = new Error(`Clarity API error: ${response.status} ${response.statusText}`);
      (err as Error & { status: number }).status = response.status;
      throw err;
    }

    return response.json();
  }

  private findMetric(metrics: ClarityMetric[], name: string): Record<string, unknown>[] {
    return metrics.find((m) => m.metricName === name)?.information || [];
  }

  async getInsights(numOfDays: 1 | 2 | 3 = 3): Promise<ClarityInsights> {
    const metrics = await this.fetchMetrics(numOfDays);

    const traffic = this.findMetric(metrics, "Traffic")[0] || {};
    const engagement = this.findMetric(metrics, "EngagementTime")[0] || {};
    const scrollDepthData = this.findMetric(metrics, "ScrollDepth")[0] || {};
    const deadClicks = this.findMetric(metrics, "DeadClickCount")[0] || {};
    const rageClicks = this.findMetric(metrics, "RageClickCount")[0] || {};
    const quickbacks = this.findMetric(metrics, "QuickbackClick")[0] || {};
    const errorClicks = this.findMetric(metrics, "ErrorClickCount")[0] || {};
    const scriptErrors = this.findMetric(metrics, "ScriptErrorCount")[0] || {};
    const excessiveScrolls = this.findMetric(metrics, "ExcessiveScroll")[0] || {};

    const popularPages = this.findMetric(metrics, "PopularPages");
    const devices = this.findMetric(metrics, "Device");
    const browsers = this.findMetric(metrics, "Browser");
    const countries = this.findMetric(metrics, "Country");

    const totalSessions = toNum(traffic.totalSessionCount);
    const botSessions = toNum(traffic.totalBotSessionCount);

    return {
      traffic: {
        totalSessions: Math.max(0, totalSessions - botSessions),
        botSessions,
        distinctUsers: toNum(traffic.distinctUserCount),
        pagesPerSession: toFloat(traffic.pagesPerSessionPercentage),
      },
      engagement: {
        totalTime: toNum(engagement.totalTime),
        activeTime: toNum(engagement.activeTime),
      },
      scrollDepth: toFloat(scrollDepthData.averageScrollDepth),
      frustration: {
        deadClicks: toNum(deadClicks.subTotal),
        rageClicks: toNum(rageClicks.subTotal),
        quickbacks: toNum(quickbacks.subTotal),
        errorClicks: toNum(errorClicks.subTotal),
        scriptErrors: toNum(scriptErrors.subTotal),
        excessiveScrolls: toNum(excessiveScrolls.subTotal),
      },
      topPages: popularPages
        .map((p) => ({ url: String(p.url || ""), visits: toNum(p.visitsCount) }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10),
      devices: devices
        .map((d) => ({ name: String(d.name || "Unknown"), sessions: toNum(d.sessionsCount) }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5),
      browsers: browsers
        .map((b) => ({ name: String(b.name || "Unknown"), sessions: toNum(b.sessionsCount) }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 5),
      countries: countries
        .map((c) => ({ name: String(c.name || "Unknown"), sessions: toNum(c.sessionsCount) }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10),
    };
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.fetchMetrics(1);
      return true;
    } catch {
      return false;
    }
  }
}

function toNum(val: unknown): number {
  return parseInt(String(val || "0"), 10) || 0;
}

function toFloat(val: unknown): number {
  return parseFloat(String(val || "0")) || 0;
}

export function createClarityClient(creds: ClarityClientCreds): ClarityClient {
  return new ClarityClient(creds);
}

export const clarityClient = new ClarityClient();
