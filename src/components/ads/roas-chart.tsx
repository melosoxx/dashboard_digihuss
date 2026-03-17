"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MetaDailyMetric } from "@/types/meta";

interface ROASChartProps {
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

export function ROASChart({ data, isLoading }: ROASChartProps) {
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
        <CardTitle className="text-sm font-semibold">Tendencia ROAS</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
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
              tickFormatter={(v) => `${v.toFixed(1)}x`}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(2)}x`, "ROAS"]}
              labelFormatter={(label) => new Date(label + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", month: "short", day: "numeric" })}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "var(--chart-item-style)" }}
              labelStyle={{ color: "var(--chart-label-style)", marginBottom: 4 }}
            />
            <ReferenceLine
              y={1}
              stroke="rgba(239, 68, 68, 0.4)"
              strokeDasharray="3 3"
              label={{ value: "Equilibrio", position: "right", fontSize: 10, fill: "rgba(150, 165, 200, 0.5)" }}
            />
            <Line
              type="monotone"
              dataKey="roas"
              stroke="#14b8a6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
