"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, ShoppingBag } from "lucide-react";
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
        <CardTitle className="text-base">Atribucion de Ventas</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked percentage bar */}
        <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-4">
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${metaPct}%` }}
            title={`Meta Ads: ${metaPct.toFixed(1)}%`}
          />
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${organicPct}%` }}
            title={`Organico: ${organicPct.toFixed(1)}%`}
          />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-4">
          {/* Meta Ads */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Meta Ads</span>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">{formatCurrency(metaRevenue)}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(metaConversions)} pedidos
              </p>
              <Badge variant="outline" className="text-xs mt-1">
                {metaPct.toFixed(1)}% del total
              </Badge>
            </div>
          </div>

          {/* Organic/Other */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Organico / Otros</span>
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">{formatCurrency(organicRevenue)}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(organicOrders)} pedidos
              </p>
              <Badge variant="outline" className="text-xs mt-1">
                {organicPct.toFixed(1)}% del total
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Atribucion basada en el modelo de Meta Ads (7 dias clic, 1 dia vista)
        </p>
      </CardContent>
    </Card>
  );
}
