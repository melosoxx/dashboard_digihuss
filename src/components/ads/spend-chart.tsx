"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";
import type { MetaDailyMetric } from "@/types/meta";

interface SpendChartProps {
  data: MetaDailyMetric[];
  isLoading: boolean;
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--tooltip-bg)",
  border: "var(--tooltip-border)",
  borderRadius: "10px",
  boxShadow: "var(--tooltip-shadow)",
  color: "var(--tooltip-color)",
};

export function SpendChart({ data, isLoading }: SpendChartProps) {
  const { formatMoney, convert, currencySymbol } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Gasto en Publicidad</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-axis)" }}
              tickFormatter={(v) => new Date(v + "T00:00:00").toLocaleDateString("es-AR", { month: "short", day: "numeric" })}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${currencySymbol}${convert(v).toFixed(0)}`}
            />
            <Tooltip
              formatter={(value) => [formatMoney(Number(value)), "Gasto"]}
              labelFormatter={(label) => new Date(label + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", month: "short", day: "numeric" })}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "var(--chart-item-style)" }}
              labelStyle={{ color: "var(--chart-label-style)", marginBottom: 4 }}
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#ef4444"
              fill="url(#spendGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}