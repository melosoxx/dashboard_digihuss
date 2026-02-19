"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  date: string;
  revenue: number;
  adSpend: number;
}

interface SpendVsRevenueProps {
  data: DataPoint[];
  isLoading: boolean;
}

export function SpendVsRevenueChart({ data, isLoading }: SpendVsRevenueProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-[350px] w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ad Spend vs Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => new Date(v + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                name === "revenue" ? "Revenue" : "Ad Spend",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
              name="Revenue"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="adSpend"
              stroke="hsl(var(--chart-5))"
              strokeWidth={2}
              dot={false}
              name="Ad Spend"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
