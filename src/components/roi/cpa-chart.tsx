"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";

interface CPADataPoint {
  date: string;
  cpa: number;
}

interface CPAChartProps {
  data: CPADataPoint[];
  isLoading: boolean;
}

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15, 20, 35, 0.95)",
  border: "1px solid rgba(100, 120, 180, 0.2)",
  borderRadius: "10px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
};

export function CPAChart({ data, isLoading }: CPAChartProps) {
  const { formatMoney, convert, currencySymbol } = useCurrency();

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
        <CardTitle className="text-sm font-semibold">Tendencia de Costo por Adquisicion</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 120, 180, 0.08)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "rgba(150, 165, 200, 0.6)" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(100, 120, 180, 0.1)" }}
              tickFormatter={(v) => new Date(v + "T00:00:00").toLocaleDateString("es-AR", { month: "short", day: "numeric" })}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgba(150, 165, 200, 0.6)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${currencySymbol}${convert(v).toFixed(0)}`}
            />
            <Tooltip
              formatter={(value) => [formatMoney(Number(value)), "CPA"]}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "rgba(220, 230, 255, 0.9)" }}
              labelStyle={{ color: "rgba(150, 165, 200, 0.7)", marginBottom: 4 }}
            />
            <Line
              type="monotone"
              dataKey="cpa"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}