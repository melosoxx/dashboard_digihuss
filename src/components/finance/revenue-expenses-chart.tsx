"use client";

import {
  BarChart,
  Bar,
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

interface DailyFinancePoint {
  date: string;
  revenue: number;
  adSpend: number;
  mpFees: number;
  otherExpenses: number;
  netProfit: number;
}

interface RevenueExpensesChartProps {
  data: DailyFinancePoint[];
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

export function RevenueExpensesChart({
  data,
  isLoading,
}: RevenueExpensesChartProps) {
  const { formatMoney, convert, currencySymbol } = useCurrency();

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0 py-3">
          <Skeleton className="h-5 w-48" />
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
        <CardTitle className="text-sm font-semibold">
          Ingresos vs Egresos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
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
              labelStyle={{
                color: "var(--chart-label-style)",
                marginBottom: 4,
              }}
              cursor={{ fill: "rgba(100, 120, 180, 0.06)" }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: "rgba(100, 116, 139, 0.7)",
              }}
            />
            <Bar
              dataKey="revenue"
              fill="#10b981"
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              name="Ingresos"
            />
            <Bar
              dataKey="adSpend"
              fill="#f43f5e"
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              name="Publicidad"
              stackId="expenses"
            />
            <Bar
              dataKey="mpFees"
              fill="#f59e0b"
              fillOpacity={0.85}
              radius={[0, 0, 0, 0]}
              name="Comisiones MP"
              stackId="expenses"
            />
            <Bar
              dataKey="otherExpenses"
              fill="#6b7280"
              fillOpacity={0.85}
              radius={[4, 4, 0, 0]}
              name="Otros Gastos"
              stackId="expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
