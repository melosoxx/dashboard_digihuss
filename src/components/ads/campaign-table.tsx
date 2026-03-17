"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatNumber, cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import type { MetaCampaignInsight } from "@/types/meta";

interface CampaignTableProps {
  campaigns: MetaCampaignInsight[];
  isLoading: boolean;
}

function getRoasBadge(roas: number) {
  if (roas >= 3) return { label: `${roas.toFixed(1)}x`, className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25" };
  if (roas >= 1) return { label: `${roas.toFixed(1)}x`, className: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/25" };
  return { label: `${roas.toFixed(1)}x`, className: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/25" };
}

export function CampaignTable({ campaigns, isLoading }: CampaignTableProps) {
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
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
        <CardTitle className="text-sm font-semibold">Rendimiento de Campañas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
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
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                    No se encontraron datos de campañas en este periodo
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => {
                  const roasBadge = getRoasBadge(campaign.roas);
                  return (
                    <tr key={campaign.campaignId} className="border-b border-border/20 last:border-0">
                      <td className="py-3 pr-4 font-medium text-[13px] max-w-[200px] truncate">
                        {campaign.campaignName}
                      </td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">{formatMoney(campaign.spend)}</td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">{formatNumber(campaign.impressions)}</td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">{formatNumber(campaign.clicks)}</td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">{formatMoney(campaign.cpc)}</td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">{campaign.ctr.toFixed(2)}%</td>
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