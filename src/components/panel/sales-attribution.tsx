"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";

interface SalesAttributionProps {
  totalRevenue: number;
  totalOrders: number;
  metaRevenue: number;
  metaConversions: number;
  isLoading: boolean;
}

export function SalesAttribution({
  totalRevenue,
  totalOrders,
  metaRevenue,
  metaConversions,
  isLoading,
}: SalesAttributionProps) {
  const { formatMoney } = useCurrency();
  const organicRevenue = Math.max(totalRevenue - metaRevenue, 0);
  const organicOrders = Math.max(totalOrders - metaConversions, 0);
  const metaPct = totalRevenue > 0 ? (metaRevenue / totalRevenue) * 100 : 0;
  const organicPct = totalRevenue > 0 ? (organicRevenue / totalRevenue) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="h-full py-0 gap-0">
        <CardContent className="px-3 py-2 h-full flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full py-0 gap-0">
      <CardContent className="px-3 py-2 h-full flex flex-col gap-2">
        {/* Title + bar + legend — stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Atribucion de Ventas
            </span>
            <div className="flex-1 flex h-1.5 rounded-full overflow-hidden bg-muted/50">
              <div
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${metaPct}%` }}
              />
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${organicPct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-shrink-0">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              Meta Ads ({metaPct.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              Orgánico ({organicPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Sub-cards */}
        <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Meta Ads</span>
              <span className="text-[10px] text-muted-foreground">{metaPct.toFixed(1)}%</span>
            </div>
            <p className="text-sm font-bold leading-tight">{formatMoney(metaRevenue)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{formatNumber(metaConversions)} pedidos</p>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Orgánico</span>
              <span className="text-[10px] text-muted-foreground">{organicPct.toFixed(1)}%</span>
            </div>
            <p className="text-sm font-bold leading-tight">{formatMoney(organicRevenue)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{formatNumber(organicOrders)} pedidos</p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/40 flex items-center gap-1 flex-shrink-0">
          <Info className="h-2.5 w-2.5 flex-shrink-0" />
          Atribucion basada en Meta Ads (7 dias clic, 1 dia vista).
        </p>
      </CardContent>
    </Card>
  );
}
