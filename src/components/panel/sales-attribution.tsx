"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, ShoppingBag, Info } from "lucide-react";
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
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold">Atribucion de Ventas</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {/* Stacked percentage bar */}
        <div className="flex h-2 rounded-full overflow-hidden bg-muted/50 mb-1.5">
          <div
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${metaPct}%` }}
          />
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${organicPct}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Meta Ads ({metaPct.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Organico ({organicPct.toFixed(1)}%)
          </span>
        </div>

        {/* Side-by-side cards */}
        <div className="grid grid-cols-2 gap-2">
          {/* Meta Ads */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Meta Ads</span>
              <span className="text-[10px] text-muted-foreground">{metaPct.toFixed(1)}%</span>
            </div>
            <p className="text-base font-bold">{formatMoney(metaRevenue)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatNumber(metaConversions)} pedidos
            </p>
          </div>

          {/* Organic/Other */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Orgánico</span>
              <span className="text-[10px] text-muted-foreground">{organicPct.toFixed(1)}%</span>
            </div>
            <p className="text-base font-bold">{formatMoney(organicRevenue)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatNumber(organicOrders)} pedidos
            </p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/50 mt-2.5 flex items-center gap-1">
          <Info className="h-3 w-3 flex-shrink-0" />
          Atribucion basada en Meta Ads (7 dias clic, 1 dia vista). Data syncs every 15 minutes.
        </p>
      </CardContent>
    </Card>
  );
}
