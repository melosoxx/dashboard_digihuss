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
        <CardTitle className="text-base">Tendencia ROAS</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => new Date(v + "T00:00:00").toLocaleDateString("es-AR", { month: "short", day: "numeric" })}
            />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v.toFixed(1)}x`} />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(2)}x`, "ROAS"]}
              labelFormatter={(label) => new Date(label + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", month: "short", day: "numeric" })}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <ReferenceLine
              y={1}
              stroke="hsl(var(--destructive))"
              strokeDasharray="3 3"
              label={{ value: "Punto de equilibrio", position: "right", fontSize: 11 }}
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
