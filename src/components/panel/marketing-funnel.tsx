"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactNumber, cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";

interface MarketingFunnelProps {
  impressions: number;
  clicks: number;
  landingSessions: number;
  checkouts: number;
  orders: number;
  isLoading: boolean;
}

const STAGES = [
  { key: "impressions", label: "Impresiones", color: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/30", text: "text-violet-400", bg: "bg-violet-500" },
  { key: "clicks", label: "Clics", color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/30", text: "text-blue-400", bg: "bg-blue-500" },
  { key: "landing", label: "Ses. Landing", color: "from-teal-500/20 to-teal-500/5", border: "border-teal-500/30", text: "text-teal-400", bg: "bg-teal-500" },
  { key: "checkouts", label: "Checkouts", color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/30", text: "text-amber-400", bg: "bg-amber-500" },
  { key: "orders", label: "Pedidos", color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-400", bg: "bg-emerald-500" },
] as const;

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
        <div className="space-y-1.5">
          {STAGES.map((stage, i) => {
            const val = values[i];
            const logVal = val > 0 ? Math.log10(val) : 0;
            const widthPct = logMax > 0 ? Math.max((logVal / logMax) * 100, 8) : 8;
            const rate = i < rates.length ? rates[i] : null;

            return (
              <div key={stage.key}>
                {/* Stage bar */}
                <div className="flex items-center gap-3">
                  <div className="w-[100px] shrink-0 text-right">
                    <span className="text-[11px] text-muted-foreground">{stage.label}</span>
                  </div>
                  <div className="flex-1 relative">
                    <div
                      className={cn(
                        "h-10 rounded-lg border bg-gradient-to-r transition-all duration-500",
                        stage.color,
                        stage.border,
                      )}
                      style={{ width: `${widthPct}%` }}
                    >
                      <div className="absolute inset-y-0 flex items-center pl-3">
                        <span className={cn("text-sm font-bold", stage.text)}>
                          {formatCompactNumber(val)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion arrow between stages */}
                {rate && (
                  <div className="flex items-center gap-3 py-0.5">
                    <div className="w-[100px] shrink-0" />
                    <div className="flex items-center gap-1.5 pl-2">
                      <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                      <span className={cn("text-[11px] font-medium", getDropoffColor(rate.raw))}>
                        {rate.value}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">{rate.label}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground/50 mt-4">
          Ses. Landing = sesiones del online store (Shopify)
        </p>
      </CardContent>
    </Card>
  );
}
