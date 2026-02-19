"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { MetaCampaignInsight } from "@/types/meta";

interface CampaignTableProps {
  campaigns: MetaCampaignInsight[];
  isLoading: boolean;
}

function getRoasBadge(roas: number) {
  if (roas >= 3) return { label: `${roas.toFixed(1)}x`, variant: "default" as const, className: "bg-emerald-600" };
  if (roas >= 1) return { label: `${roas.toFixed(1)}x`, variant: "secondary" as const, className: "bg-yellow-600 text-white" };
  return { label: `${roas.toFixed(1)}x`, variant: "destructive" as const, className: "" };
}

export function CampaignTable({ campaigns, isLoading }: CampaignTableProps) {
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
        <CardTitle className="text-base">Campaign Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Impressions</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">CPC</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No campaign data found for this period
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => {
                const roasBadge = getRoasBadge(campaign.roas);
                return (
                  <TableRow key={campaign.campaignId}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {campaign.campaignName}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.impressions)}</TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.clicks)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(campaign.cpc)}</TableCell>
                    <TableCell className="text-right">{campaign.ctr.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={roasBadge.variant} className={cn("text-xs", roasBadge.className)}>
                        {roasBadge.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
