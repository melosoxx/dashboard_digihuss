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
        <CardTitle className="text-base">Gasto en Ads vs Ingresos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => new Date(v + "T00:00:00").toLocaleDateString("es-AR", { month: "short", day: "numeric" })}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                name === "Ingresos" ? "Ingresos" : "Gasto Ads",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Ingresos"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="adSpend"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Gasto Ads"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
