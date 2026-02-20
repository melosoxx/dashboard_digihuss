"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, ShoppingBag, Info } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

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
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Atribucion de Ventas</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked percentage bar */}
        <div className="flex h-3 rounded-full overflow-hidden bg-muted/50 mb-2">
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
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Meta Ads ({metaPct.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Organico ({organicPct.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Meta Ads */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Megaphone className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Meta Ads</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{metaPct.toFixed(1)}% share</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(metaRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(metaConversions)} pedidos
            </p>
          </div>

          {/* Organic/Other */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Organico / Otros</span>
              </div>
              <span className="text-[11px] text-muted-foreground">{organicPct.toFixed(1)}% share</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(organicRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(organicOrders)} pedidos
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-4 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Atribucion basada en Meta Ads (7 dias clic, 1 dia vista). Data syncs every 15 minutes.
        </p>
      </CardContent>
    </Card>
  );
}
