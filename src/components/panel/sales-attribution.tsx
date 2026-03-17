"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Sprout } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";

function MetaLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" />
    </svg>
  );
}

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
      <Card className="h-full py-0 gap-0 rounded-2xl">
        <CardContent className="p-6 h-full flex flex-col gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full py-0 gap-0 rounded-2xl">
      <CardContent className="p-6 h-full flex flex-col">
        {/* Title + Legend */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Atribución de Ventas
          </span>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="text-muted-foreground">Meta Ads ({metaPct.toFixed(1)}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="text-muted-foreground">Orgánico ({organicPct.toFixed(1)}%)</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-muted rounded-full flex overflow-hidden mb-4">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${metaPct}%` }}
          />
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${organicPct}%` }}
          />
        </div>

        {/* Sub-cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Meta Ads Card */}
          <div className="relative overflow-hidden rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-900/10 px-5 py-3 flex flex-col justify-end">
            {/* Decorative icon — centered right */}
            <MetaLogoIcon className="absolute top-1/2 -translate-y-1/2 right-4 w-14 h-14 text-blue-500 opacity-20 pointer-events-none" />
            {/* Percentage badge */}
            <span className="absolute top-3 right-3 text-[9px] font-semibold text-muted-foreground bg-blue-100 dark:bg-blue-500/10 rounded-full px-2 py-0.5">{metaPct.toFixed(1)}%</span>
            <div className="z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 block mb-1">Meta Ads</span>
              <p className="text-2xl font-bold leading-tight mb-0.5">{formatMoney(metaRevenue)}</p>
              <p className="text-xs text-muted-foreground">{formatNumber(metaConversions)} pedidos</p>
            </div>
          </div>

          {/* Organic Card */}
          <div className="relative overflow-hidden rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/10 px-5 py-3 flex flex-col justify-end">
            {/* Decorative icon — centered right */}
            <Sprout className="absolute top-1/2 -translate-y-1/2 right-4 w-14 h-14 text-emerald-500 opacity-20 pointer-events-none" />
            {/* Percentage badge */}
            <span className="absolute top-3 right-3 text-[9px] font-semibold text-muted-foreground bg-emerald-100 dark:bg-emerald-500/10 rounded-full px-2 py-0.5">{organicPct.toFixed(1)}%</span>
            <div className="z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">Orgánico</span>
              <p className="text-2xl font-bold leading-tight mb-0.5">{formatMoney(organicRevenue)}</p>
              <p className="text-xs text-muted-foreground">{formatNumber(organicOrders)} pedidos</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-[10px] text-muted-foreground/40 flex items-center gap-1.5 flex-shrink-0">
          <Info className="h-3 w-3 flex-shrink-0" />
          Atribución basada en Meta Ads (7 días clic, 1 día vista).
        </p>
      </CardContent>
    </Card>
  );
}
