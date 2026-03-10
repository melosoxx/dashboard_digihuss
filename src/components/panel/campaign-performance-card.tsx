"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import type { MetaCampaignInsight } from "@/types/meta";

interface CampaignPerformanceCardProps {
  campaigns: MetaCampaignInsight[];
  isLoading: boolean;
}

function getRoasBadge(roas: number) {
  if (roas >= 4) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
  if (roas >= 2) return "bg-amber-500/15 text-amber-400 border-amber-500/25";
  return "bg-red-500/15 text-red-400 border-red-500/25";
}

export function CampaignPerformanceCard({ campaigns, isLoading }: CampaignPerformanceCardProps) {
  const { formatMoney } = useCurrency();
  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const sorted = [...campaigns].sort((a, b) => b.spend - a.spend);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Performance por Campaña</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay campañas activas en este momento
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Campaña</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Gasto</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Ingresos</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">ROAS</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => {
                  const revenue = c.roas * c.spend;
                  return (
                    <tr key={c.campaignId} className="border-b border-border/10 last:border-0 hover:bg-white/[0.03] transition-colors duration-150">
                      <td className="py-3 pr-4">
                        <span className="text-[13px] font-medium">{c.campaignName}</span>
                      </td>
                      <td className="py-3 text-right text-[13px] text-emerald-400 font-medium">
                        {formatMoney(c.spend)}
                      </td>
                      <td className="py-3 text-right text-[13px] text-muted-foreground">
                        {formatMoney(revenue)}
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant="outline" className={cn("text-[10px] font-semibold border", getRoasBadge(c.roas))}>
                          {c.roas.toFixed(2)}x
                        </Badge>
                      </td>
                      <td className="py-3 text-right text-[13px] text-muted-foreground">
                        {c.conversions}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
