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
import { formatCurrency } from "@/lib/utils";
import type { MetaDailyMetric } from "@/types/meta";

interface SpendChartProps {
  data: MetaDailyMetric[];
  isLoading: boolean;
}

export function SpendChart({ data, isLoading }: SpendChartProps) {
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
        <CardTitle className="text-base">Ad Spend Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => new Date(v + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), "Spend"]}
              labelFormatter={(label) => new Date(label + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="hsl(var(--chart-5))"
              fill="url(#spendGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
