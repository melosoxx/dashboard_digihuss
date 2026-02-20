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

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15, 20, 35, 0.95)",
  border: "1px solid rgba(100, 120, 180, 0.2)",
  borderRadius: "10px",
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
};

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
        <CardTitle className="text-sm font-semibold">Embudo de Conversion</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 120, 180, 0.08)" horizontal={false} />
            <XAxis
              type="number"
              scale="log"
              domain={[1, "auto"]}
              tick={{ fontSize: 11, fill: "rgba(150, 165, 200, 0.6)" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(100, 120, 180, 0.1)" }}
              tickFormatter={(v) => formatCompactNumber(v)}
              allowDataOverflow
            />
            <YAxis
              type="category"
              dataKey="stage"
              tick={{ fontSize: 11, fill: "rgba(150, 165, 200, 0.7)" }}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(_value: any, _name: any, props: any) => {
                const stage = props.payload?.stage as string | undefined;
                const real = stage ? rawValues[stage] : Number(_value);
                return [formatCompactNumber(real), "Cantidad"];
              }}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "rgba(220, 230, 255, 0.9)" }}
              labelStyle={{ color: "rgba(150, 165, 200, 0.7)", marginBottom: 4 }}
            />
            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
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
                    fill="rgba(150, 165, 200, 0.7)"
                    fontSize={11}
                    dominantBaseline="central"
                  >
                    {formatCompactNumber(real)}
                  </text>
                );
              }}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={STAGE_COLORS[index]} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-xs text-muted-foreground">
          {rates.map((rate) => (
            <div key={rate.label} className="text-center">
              <p className="font-semibold text-foreground">{rate.value}</p>
              <p>{rate.label}</p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-3">
          Ses. Landing = sesiones del online store (Shopify)
        </p>
      </CardContent>
    </Card>
  );
}
