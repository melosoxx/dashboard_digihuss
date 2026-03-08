"use client";

import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";

interface DataPoint {
  date: string;
  revenue: number;
  adSpend: number;
}

interface SpendVsRevenueProps {
  data: DataPoint[];
  isLoading: boolean;
}

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15, 20, 35, 0.95)",
  border: "1px solid rgba(100, 120, 180, 0.2)",
  borderRadius: "10px",
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
};

export function SpendVsRevenueChart({ data, isLoading }: SpendVsRevenueProps) {
  const { convert, currencySymbol } = useCurrency();

  function formatAxisValue(v: number): string {
    const c = convert(v);
    if (c >= 1_000_000) return `${currencySymbol}${(c / 1_000_000).toFixed(1)}M`;
    if (c >= 1_000) return `${currencySymbol}${(c / 1_000).toFixed(0)}k`;
    return `${currencySymbol}${c.toFixed(0)}`;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-56" /></CardHeader>
        <CardContent><Skeleton className="h-[350px] w-full" /></CardContent>
      </Card>
    );
  }

  const avgRevenue =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.revenue, 0) / data.length
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Ingresos vs Gasto diario</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 120, 180, 0.08)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "rgba(150, 165, 200, 0.6)" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(100, 120, 180, 0.1)" }}
              tickFormatter={(v) =>
                new Date(v + "T00:00:00").toLocaleDateString("es-AR", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgba(150, 165, 200, 0.6)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxisValue}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "Ingresos") return [formatAxisValue(Number(value)), "Ingresos"];
                return [formatAxisValue(Number(value)), "Gasto Ads"];
              }}
              labelFormatter={(label) =>
                new Date(label + "T00:00:00").toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                })
              }
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "rgba(220, 230, 255, 0.9)" }}
              labelStyle={{ color: "rgba(150, 165, 200, 0.7)", marginBottom: 4 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "rgba(150, 165, 200, 0.7)" }}
            />
            {avgRevenue > 0 && (
              <ReferenceLine
                y={avgRevenue}
                stroke="#a78bfa"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{
                  value: `─ Promedio ${formatAxisValue(avgRevenue)}`,
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "#a78bfa",
                  dy: -10,
                }}
              />
            )}
            <Bar
              dataKey="adSpend"
              fill="#f43f5e"
              fillOpacity={0.85}
              radius={[3, 3, 0, 0]}
              name="Gasto Ads"
              maxBarSize={14}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              fill="#10b981"
              fillOpacity={0.15}
              stroke="#10b981"
              strokeWidth={2}
              name="Ingresos"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
