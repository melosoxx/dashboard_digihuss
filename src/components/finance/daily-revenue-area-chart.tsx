"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";

interface DailyPayment {
  date: string;
  gross: number;
  net: number;
  fees: number;
}

interface DailyRevenueAreaChartProps {
  data: DailyPayment[];
  isLoading: boolean;
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--tooltip-bg)",
  border: "var(--tooltip-border)",
  borderRadius: "10px",
  backdropFilter: "blur(8px)",
  boxShadow: "var(--tooltip-shadow)",
  color: "var(--tooltip-color)",
};

export function DailyRevenueAreaChart({
  data,
  isLoading,
}: DailyRevenueAreaChartProps) {
  const { formatMoney, convert, currencySymbol } = useCurrency();

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0 py-3">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 py-3">
        <CardTitle className="text-sm font-semibold">Ingresos Diarios</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradGross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--chart-grid)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-axis)" }}
              tickFormatter={(v) =>
                new Date(v + "T00:00:00").toLocaleDateString("es-AR", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${currencySymbol}${(convert(v) / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => [formatMoney(Number(value)), name]}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "var(--chart-item-style)" }}
              labelStyle={{ color: "var(--chart-label-style)", marginBottom: 4 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "rgba(100, 116, 139, 0.7)" }}
            />
            <Area
              type="monotone"
              dataKey="gross"
              stroke="#10b981"
              fill="url(#gradGross)"
              strokeWidth={2}
              name="Bruto"
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="#0ea5e9"
              fill="url(#gradNet)"
              strokeWidth={2}
              name="Neto"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
