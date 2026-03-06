"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCompactNumber, cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";

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
}

const STAGES = [
  { key: "impressions", label: "Impresiones", color: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/30", text: "text-violet-400", bg: "bg-violet-500" },
  { key: "clicks", label: "Clics", color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/30", text: "text-blue-400", bg: "bg-blue-500" },
  { key: "landing", label: "Ses. Landing", color: "from-teal-500/20 to-teal-500/5", border: "border-teal-500/30", text: "text-teal-400", bg: "bg-teal-500" },
  { key: "checkouts", label: "Checkouts", color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/30", text: "text-amber-400", bg: "bg-amber-500" },
  { key: "orders", label: "Pedidos", color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500" },
] as const;

const STAGE_FIELD: Record<string, keyof FunnelProfileBreakdown> = {
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
  if (rate >= 30) return "text-emerald-400";
  if (rate >= 10) return "text-amber-400";
  return "text-red-400";
}

export function MarketingFunnel({
  impressions,
  clicks,
  landingSessions,
  checkouts,
  orders,
  isLoading,
  profileBreakdown,
}: MarketingFunnelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const values = [impressions, clicks, landingSessions, checkouts, orders];
  const logMax = Math.log10(Math.max(...values, 1));
  const showTooltip = profileBreakdown && profileBreakdown.length > 1;

  const rates = [
    { label: "CTR", value: getConversionRate(impressions, clicks), raw: impressions > 0 ? (clicks / impressions) * 100 : 0 },
    { label: "Clic → Landing", value: getConversionRate(clicks, landingSessions), raw: clicks > 0 ? (landingSessions / clicks) * 100 : 0 },
    { label: "Landing → Checkout", value: getConversionRate(landingSessions, checkouts), raw: landingSessions > 0 ? (checkouts / landingSessions) * 100 : 0 },
    { label: "Checkout → Pedido", value: getConversionRate(checkouts, orders), raw: checkouts > 0 ? (orders / checkouts) * 100 : 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Embudo de Conversion</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex flex-col items-center gap-1">
            {STAGES.map((stage, i) => {
              const val = values[i];
              const logVal = val > 0 ? Math.log10(val) : 0;
              const widthPct = logMax > 0 ? Math.max((logVal / logMax) * 100, 12) : 12;
              const rate = i < rates.length ? rates[i] : null;
              const field = STAGE_FIELD[stage.key];

              const bar = (
                <div
                  className={cn(
                    "h-9 rounded-lg border bg-gradient-to-r transition-all duration-500 flex items-center justify-center gap-1.5",
                    showTooltip && "cursor-pointer",
                    stage.color,
                    stage.border,
                  )}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="text-xs font-medium text-white">{stage.label}</span>
                  <span className={cn("text-sm font-bold", stage.text)}>
                    {formatCompactNumber(val)}
                  </span>
                </div>
              );

              return (
                <div key={stage.key} className="w-full flex flex-col items-center">
                  {showTooltip ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{bar}</TooltipTrigger>
                      <TooltipContent
                        side="right"
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

                  {/* Conversion arrow between stages */}
                  {rate && (
                    <div className="flex items-center gap-1.5 py-1">
                      <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                      <span className={cn("text-[11px] font-medium", getDropoffColor(rate.raw))}>
                        {rate.value}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">{rate.label}</span>
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
