"use client";

import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowRight, TrendingDown } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { MetaCampaignInsight } from "@/types/meta";

interface TopCampaignsCardProps {
  campaigns: MetaCampaignInsight[];
  isLoading: boolean;
}

function getRoasBadge(roas: number) {
  if (roas >= 3) return { label: `${roas.toFixed(1)}x`, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
  if (roas >= 1) return { label: `${roas.toFixed(1)}x`, className: "bg-amber-500/15 text-amber-400 border-amber-500/25" };
  return { label: `${roas.toFixed(1)}x`, className: "bg-red-500/15 text-red-400 border-red-500/25" };
}

function getRoasTrend(roas: number) {
  if (roas >= 2) return { icon: ArrowUpRight, className: "text-emerald-400" };
  if (roas >= 1) return { icon: ArrowRight, className: "text-muted-foreground" };
  return { icon: TrendingDown, className: "text-red-400" };
}

export function TopCampaignsCard({ campaigns, isLoading }: TopCampaignsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const sorted = [...campaigns].sort((a, b) => b.roas - a.roas);
  const topCampaigns = sorted.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Campañas Activas</CardTitle>
        {campaigns.length > 5 && (
          <CardAction>
            <span className="text-xs text-primary cursor-pointer hover:underline">Ver Todas</span>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {topCampaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No se encontraron campañas en este periodo
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Campaña</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Gasto</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Revenue</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">ROAS</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topCampaigns.map((campaign) => {
                  const roasBadge = getRoasBadge(campaign.roas);
                  const trend = getRoasTrend(campaign.roas);
                  const TrendIcon = trend.icon;
                  const estimatedRevenue = campaign.spend * campaign.roas;
                  return (
                    <tr key={campaign.campaignId} className="border-b border-border/20 last:border-0">
                      <td className="py-3 pr-4">
                        <span className="text-[13px] font-medium truncate block max-w-[200px]">
                          {campaign.campaignName}
                        </span>
                      </td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">
                        {formatCurrency(campaign.spend)}
                      </td>
                      <td className="py-3 text-right text-[13px]">
                        {formatCurrency(estimatedRevenue)}
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant="outline" className={cn("text-[10px] font-semibold border", roasBadge.className)}>
                          {roasBadge.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <TrendIcon className={cn("h-4 w-4 ml-auto", trend.className)} />
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
