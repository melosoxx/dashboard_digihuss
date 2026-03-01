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
import { formatCurrency } from "@/lib/utils";

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
  backgroundColor: "rgba(15, 20, 35, 0.95)",
  border: "1px solid rgba(100, 120, 180, 0.2)",
  borderRadius: "10px",
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
};

export function RevenueExpensesChart({
  data,
  isLoading,
}: RevenueExpensesChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Ingresos vs Egresos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} barGap={2}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(100, 120, 180, 0.08)"
              vertical={false}
            />
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
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value)), name]}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "rgba(220, 230, 255, 0.9)" }}
              labelStyle={{
                color: "rgba(150, 165, 200, 0.7)",
                marginBottom: 4,
              }}
              cursor={{ fill: "rgba(100, 120, 180, 0.06)" }}
            />
            <Legend
              wrapperStyle={{
                fontSize: 12,
                color: "rgba(150, 165, 200, 0.7)",
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
