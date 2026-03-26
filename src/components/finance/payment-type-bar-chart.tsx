"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";

interface PaymentTypeData {
  type: string;
  label: string;
  count: number;
  gross: number;
  net: number;
  fees: number;
}

interface PaymentTypeBarChartProps {
  data: PaymentTypeData[];
  isLoading: boolean;
}

const COLORS = ["#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b", "#f43f5e", "#6b7280", "#ec4899"];

const TOOLTIP_STYLE = {
  backgroundColor: "var(--tooltip-bg)",
  border: "var(--tooltip-border)",
  borderRadius: "10px",
  backdropFilter: "blur(8px)",
  boxShadow: "var(--tooltip-shadow)",
  color: "var(--tooltip-color)",
};

export function PaymentTypeBarChart({
  data,
  isLoading,
}: PaymentTypeBarChartProps) {
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0 py-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  const sorted = [...data].sort((a, b) => b.gross - a.gross);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 py-3">
        <CardTitle className="text-sm font-semibold">Por Método de Pago</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-3">
        {sorted.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sin datos</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" barSize={18}>
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatMoney(v)}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip
                formatter={(value) => [formatMoney(Number(value)), "Bruto"]}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: "var(--chart-item-style)" }}
                cursor={{ fill: "rgba(100, 120, 180, 0.06)" }}
              />
              <Bar dataKey="gross" radius={[0, 4, 4, 0]}>
                {sorted.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
