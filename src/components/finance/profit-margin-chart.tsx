"use client";

import { useMemo } from "react";
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
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";

interface DailyFinancePoint {
  date: string;
  netProfit: number;
}

interface ProfitMarginChartProps {
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

export function ProfitMarginChart({
  data,
  isLoading,
}: ProfitMarginChartProps) {
  const { formatMoney, convert, currencySymbol } = useCurrency();

  const chartData = useMemo(() => {
    let cumulative = 0;
    return data.map((d) => {
      cumulative += d.netProfit;
      return { ...d, cumulative };
    });
  }, [data]);

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
        <CardTitle className="text-sm font-semibold">Ganancia Diaria y Acumulada</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
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
              yAxisId="daily"
              tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${currencySymbol}${(convert(v) / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="cumulative"
              orientation="right"
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
            <ReferenceLine yAxisId="daily" y={0} stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <Bar
              yAxisId="daily"
              dataKey="netProfit"
              name="Ganancia Diaria"
              radius={[4, 4, 0, 0]}
              fillOpacity={0.85}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.netProfit >= 0 ? "#10b981" : "#f43f5e"}
                />
              ))}
            </Bar>
            <Line
              yAxisId="cumulative"
              type="monotone"
              dataKey="cumulative"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={false}
              name="Acumulada"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
