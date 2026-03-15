"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatNumber, cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import type { MetaAdsetInsight } from "@/types/meta";

interface AdsetTableProps {
  adsets: MetaAdsetInsight[];
  isLoading: boolean;
}

function getRoasBadge(roas: number) {
  if (roas >= 3) return { label: `${roas.toFixed(1)}x`, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
  if (roas >= 1) return { label: `${roas.toFixed(1)}x`, className: "bg-amber-500/15 text-amber-400 border-amber-500/25" };
  return { label: `${roas.toFixed(1)}x`, className: "bg-red-500/15 text-red-400 border-red-500/25" };
}

export function AdsetTable({ adsets, isLoading }: AdsetTableProps) {
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-52" /></CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Rendimiento por Conjunto de Anuncios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Conjunto</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Campaña</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Gasto</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Impresiones</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Clics</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">CPC</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">CTR</th>
                <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {adsets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted-foreground py-8 text-sm">
                    No se encontraron datos de conjuntos en este periodo
                  </td>
                </tr>
              ) : (
                adsets.map((adset) => {
                  const roasBadge = getRoasBadge(adset.roas);
                  return (
                    <tr key={adset.adsetId} className="border-b border-border/20 last:border-0">
                      <td className="py-3 pr-4 font-medium text-[13px] max-w-[200px] truncate" title={adset.adsetName}>
                        {adset.adsetName}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-[13px] max-w-[160px] truncate" title={adset.campaignName}>
                        {adset.campaignName || "-"}
                      </td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">{formatMoney(adset.spend)}</td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">{formatNumber(adset.impressions)}</td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">{formatNumber(adset.clicks)}</td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">{formatMoney(adset.cpc)}</td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">{adset.ctr.toFixed(2)}%</td>
                      <td className="py-3 text-right">
                        <Badge variant="outline" className={cn("text-[10px] font-semibold border", roasBadge.className)}>
                          {roasBadge.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}