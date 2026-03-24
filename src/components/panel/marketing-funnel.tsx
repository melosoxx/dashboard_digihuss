"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCompactNumber, cn } from "@/lib/utils";

export interface FunnelProfileBreakdown {
  profileName: string;
  profileColor: string;
  impressions: number;
  clicks: number;
  landingSessions: number;
  checkouts: number;
  orders: number;
}

interface MarketingFunnelProps {
  impressions: number;
  clicks: number;
  landingSessions: number;
  checkouts: number;
  orders: number;
  isLoading: boolean;
  profileBreakdown?: FunnelProfileBreakdown[];
  fillHeight?: boolean;
  metaEnabled?: boolean;
  clarityEnabled?: boolean;
  shopifyEnabled?: boolean;
}

type StageKey = "impressions" | "clicks" | "landing" | "checkouts" | "orders";
type Platform = "meta" | "clarity" | "shopify";

interface StageConfig {
  key: StageKey;
  label: string;
  source: string;
  platform: Platform;
  color: string;
  border: string;
  text: string;
}

const ALL_STAGES: StageConfig[] = [
  { key: "impressions", label: "Impresiones", source: "Meta Ads", platform: "meta", color: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/30", text: "text-violet-600 dark:text-violet-400" },
  { key: "clicks", label: "Clics", source: "Meta Ads", platform: "meta", color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400" },
  { key: "landing", label: "Visitas al Landing", source: "Clarity", platform: "clarity", color: "from-teal-500/20 to-teal-500/5", border: "border-teal-500/30", text: "text-teal-600 dark:text-teal-400" },
  { key: "checkouts", label: "Checkouts", source: "Shopify", platform: "shopify", color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/30", text: "text-amber-600 dark:text-amber-400" },
  { key: "orders", label: "Pedidos", source: "Shopify", platform: "shopify", color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400" },
];

const STAGE_FIELD: Record<StageKey, keyof FunnelProfileBreakdown> = {
  impressions: "impressions",
  clicks: "clicks",
  landing: "landingSessions",
  checkouts: "checkouts",
  orders: "orders",
};

const VALUE_MAP: Record<StageKey, string> = {
  impressions: "impressions",
  clicks: "clicks",
  landing: "landingSessions",
  checkouts: "checkouts",
  orders: "orders",
};

function getConversionRate(from: number, to: number): string {
  if (from === 0) return "0%";
  return `${((to / from) * 100).toFixed(1)}%`;
}

function getDropoffColor(rate: number): string {
  if (rate >= 30) return "text-emerald-600 dark:text-emerald-400";
  if (rate >= 10) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

const RATE_LABELS: Record<string, string> = {
  "impressions→clicks": "CTR",
  "clicks→landing": "Clic → Landing",
  "landing→checkouts": "Landing → Checkout",
  "checkouts→orders": "Checkout → Pedido",
  // Skip-level labels when a platform is disabled
  "clicks→checkouts": "Clic → Checkout",
  "impressions→landing": "Impresión → Landing",
  "impressions→checkouts": "Impresión → Checkout",
  "impressions→orders": "Impresión → Pedido",
  "clicks→orders": "Clic → Pedido",
  "landing→orders": "Landing → Pedido",
};

export function MarketingFunnel({
  impressions,
  clicks,
  landingSessions,
  checkouts,
  orders,
  isLoading,
  profileBreakdown,
  fillHeight = false,
  metaEnabled = true,
  clarityEnabled = true,
  shopifyEnabled = true,
}: MarketingFunnelProps) {
  const allValues: Record<StageKey, number> = {
    impressions,
    clicks,
    landing: landingSessions,
    checkouts,
    orders,
  };

  const stages = useMemo(() => {
    const platformActive: Record<Platform, boolean> = {
      meta: metaEnabled,
      clarity: clarityEnabled,
      shopify: shopifyEnabled,
    };
    return ALL_STAGES.filter((s) => platformActive[s.platform]);
  }, [metaEnabled, clarityEnabled, shopifyEnabled]);

  if (isLoading) {
    return (
      <Card className={fillHeight ? "h-full flex flex-col py-4 gap-3" : ""}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className={fillHeight ? "flex-1 min-h-0" : ""}>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Build values array for active stages only
  const values = stages.map((s) => allValues[s.key]);

  // Width scaling: first stage = 100%, second = 90%, rest scale proportionally
  const maxVal = Math.max(...values.slice(2), 1);
  function getWidthPct(i: number): number {
    if (i === 0) return 100;
    if (i === 1) return 90;
    return Math.max((values[i] / maxVal) * 85, 14);
  }

  // Build conversion rates between consecutive active stages
  const rates: Array<{ label: string; value: string; raw: number }> = [];
  for (let i = 0; i < stages.length - 1; i++) {
    const fromVal = values[i];
    const toVal = values[i + 1];
    const labelKey = `${stages[i].key}→${stages[i + 1].key}`;
    const label = RATE_LABELS[labelKey] ?? `${stages[i].label} → ${stages[i + 1].label}`;
    const raw = fromVal > 0 ? (toVal / fromVal) * 100 : 0;
    rates.push({ label, value: getConversionRate(fromVal, toVal), raw });
  }

  const showTooltip = profileBreakdown && profileBreakdown.length > 1;
  const barH = fillHeight ? "h-7" : "h-9";
  const arrowPy = fillHeight ? "py-0.5" : "py-1";

  return (
    <Card className={fillHeight ? "h-full flex flex-col py-4 gap-3" : ""}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Funnel</CardTitle>
      </CardHeader>
      <CardContent className={fillHeight ? "flex-1 min-h-0 overflow-hidden" : ""}>
        <TooltipProvider>
          <div className={cn("flex flex-col items-center", fillHeight ? "h-full justify-around" : "gap-1")}>
            {stages.map((stage, i) => {
              const val = values[i];
              const widthPct = getWidthPct(i);
              const rate = i < rates.length ? rates[i] : null;
              const field = STAGE_FIELD[stage.key];

              const bar = (
                <div
                  className={cn(
                    barH,
                    "rounded-lg border bg-gradient-to-r transition-all duration-500 flex items-center justify-center gap-1.5",
                    showTooltip && "cursor-pointer",
                    stage.color,
                    stage.border,
                  )}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="text-xs font-medium text-muted-foreground">{stage.label}</span>
                  <span className={cn("text-sm font-bold", stage.text)}>
                    {formatCompactNumber(val)}
                  </span>
                </div>
              );

              return (
                <div
                  key={stage.key}
                  className="w-full flex flex-col items-center funnel-stage"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  {/* Stage bar with source label */}
                  <div className="w-full flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground/50 w-14 text-right shrink-0 uppercase tracking-wide font-medium">
                      {stage.source}
                    </span>
                    <div className="flex-1 flex justify-center">
                      {showTooltip ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-full flex justify-center">{bar}</div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            collisionPadding={16}
                            className="bg-card border border-border px-3 py-2 text-foreground"
                          >
                            <div className="space-y-1">
                              {profileBreakdown.map((p) => (
                                <div
                                  key={p.profileName}
                                  className="flex items-center justify-between gap-4 text-xs"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="inline-block h-2 w-2 rounded-full shrink-0"
                                      style={{ backgroundColor: p.profileColor }}
                                    />
                                    <span className="text-muted-foreground">{p.profileName}</span>
                                  </div>
                                  <span className="font-semibold tabular-nums">
                                    {formatCompactNumber(p[field] as number)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        bar
                      )}
                    </div>
                    <span className="w-14 shrink-0" />
                  </div>

                  {/* Conversion rate between stages */}
                  {rate && (
                    <div className={cn("flex items-center gap-1.5", arrowPy)}>
                      <span className="text-[10px] text-muted-foreground/50">{rate.label}:</span>
                      <span className={cn("text-[11px] font-semibold tabular-nums", getDropoffColor(rate.raw))}>
                        {rate.value}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
