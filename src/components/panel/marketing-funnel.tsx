"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactNumber } from "@/lib/utils";

interface MarketingFunnelProps {
  impressions: number;
  clicks: number;
  landingSessions: number;
  checkouts: number;
  orders: number;
  isLoading: boolean;
}

const STAGE_COLORS = ["#8b5cf6", "#3b82f6", "#14b8a6", "#f59e0b", "#10b981"];

function getConversionRate(from: number, to: number): string {
  if (from === 0) return "0%";
  return `${((to / from) * 100).toFixed(1)}%`;
}

export function MarketingFunnel({
  impressions,
  clicks,
  landingSessions,
  checkouts,
  orders,
  isLoading,
}: MarketingFunnelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const data = [
    { stage: "Impresiones", value: Math.max(impressions, 1) },
    { stage: "Clics", value: Math.max(clicks, 1) },
    { stage: "Ses. Landing", value: Math.max(landingSessions, 1) },
    { stage: "Checkouts", value: Math.max(checkouts, 1) },
    { stage: "Pedidos", value: Math.max(orders, 1) },
  ];

  const rawValues: Record<string, number> = {
    Impresiones: impressions,
    Clics: clicks,
    "Ses. Landing": landingSessions,
    Checkouts: checkouts,
    Pedidos: orders,
  };

  const rates = [
    { label: "CTR", value: getConversionRate(impressions, clicks) },
    { label: "Clic→Landing", value: getConversionRate(clicks, landingSessions) },
    { label: "Landing→Checkout", value: getConversionRate(landingSessions, checkouts) },
    { label: "Checkout→Pedido", value: getConversionRate(checkouts, orders) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Embudo de Conversión</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 80 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis
              type="number"
              scale="log"
              domain={[1, "auto"]}
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatCompactNumber(v)}
              allowDataOverflow
            />
            <YAxis
              type="category"
              dataKey="stage"
              tick={{ fontSize: 12 }}
              width={110}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(_value: any, _name: any, props: any) => {
                const stage = props.payload?.stage as string | undefined;
                const real = stage ? rawValues[stage] : Number(_value);
                return [formatCompactNumber(real), "Cantidad"];
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              maxBarSize={36}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={(props: any) => {
                const { x, y, width, height, index } = props as { x: number; y: number; width: number; height: number; index: number };
                const stage = data[index]?.stage;
                const real = stage ? rawValues[stage] : 0;
                return (
                  <text
                    x={x + width + 6}
                    y={y + height / 2}
                    fill="hsl(var(--muted-foreground))"
                    fontSize={12}
                    dominantBaseline="central"
                  >
                    {formatCompactNumber(real)}
                  </text>
                );
              }}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={STAGE_COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs text-muted-foreground">
          {rates.map((rate) => (
            <div key={rate.label} className="text-center">
              <p className="font-medium text-foreground">{rate.value}</p>
              <p>{rate.label}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Ses. Landing = sesiones del online store (Shopify)
        </p>
      </CardContent>
    </Card>
  );
}
