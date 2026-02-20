"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";
import type { MetaCampaignInsight } from "@/types/meta";

interface TopCampaignsCardProps {
  campaigns: MetaCampaignInsight[];
  isLoading: boolean;
}

function getRoasBadge(roas: number) {
  if (roas >= 3) return { label: `${roas.toFixed(1)}x`, variant: "default" as const, className: "bg-emerald-600" };
  if (roas >= 1) return { label: `${roas.toFixed(1)}x`, variant: "secondary" as const, className: "bg-yellow-600 text-white" };
  return { label: `${roas.toFixed(1)}x`, variant: "destructive" as const, className: "" };
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

  const top3 = [...campaigns].sort((a, b) => b.roas - a.roas).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Campañas por ROAS</CardTitle>
      </CardHeader>
      <CardContent>
        {top3.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No se encontraron campañas en este período
          </p>
        ) : (
          <div className="space-y-3">
            {top3.map((campaign, i) => {
              const badge = getRoasBadge(campaign.roas);
              return (
                <div
                  key={campaign.campaignId}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">
                      #{i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {campaign.campaignName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gasto: {formatCurrency(campaign.spend)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={badge.variant} className={cn("text-xs shrink-0", badge.className)}>
                    {badge.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
