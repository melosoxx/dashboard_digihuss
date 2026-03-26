"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";

interface WaterfallChartProps {
  grossRevenue: number;
  mpFees: number;
  mpNetRevenue: number;
  adSpend: number;
  otherExpenses: number;
  netProfit: number;
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

interface WaterfallItem {
  name: string;
  base: number;
  value: number;
  displayValue: number;
  color: string;
}

export function WaterfallChart({
  grossRevenue,
  mpFees,
  mpNetRevenue,
  adSpend,
  otherExpenses,
  netProfit,
  isLoading,
}: WaterfallChartProps) {
  const { formatMoney, convert, currencySymbol } = useCurrency();

  const data: WaterfallItem[] = useMemo(() => {
    const items: WaterfallItem[] = [
      { name: "Bruto MP", base: 0, value: grossRevenue, displayValue: grossRevenue, color: "#10b981" },
      { name: "Comisiones", base: mpNetRevenue, value: mpFees, displayValue: -mpFees, color: "#f59e0b" },
      { name: "Neto MP", base: 0, value: mpNetRevenue, displayValue: mpNetRevenue, color: "#0ea5e9" },
    ];

    if (adSpend > 0) {
      items.push({
        name: "Publicidad",
        base: netProfit + otherExpenses,
        value: adSpend,
        displayValue: -adSpend,
        color: "#f43f5e",
      });
    }

    if (otherExpenses > 0) {
      items.push({
        name: "Otros Gastos",
        base: netProfit,
        value: otherExpenses,
        displayValue: -otherExpenses,
        color: "#6b7280",
      });
    }

    items.push({
      name: "Ganancia",
      base: 0,
      value: Math.max(netProfit, 0),
      displayValue: netProfit,
      color: netProfit >= 0 ? "#10b981" : "#f43f5e",
    });

    return items;
  }, [grossRevenue, mpFees, mpNetRevenue, adSpend, otherExpenses, netProfit]);

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
        <CardTitle className="text-sm font-semibold">Cascada de Rentabilidad</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 pb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={40}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-axis)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${currencySymbol}${(convert(v) / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(_value, _name, props) => {
                const item = props.payload as WaterfallItem;
                return [formatMoney(Math.abs(item.displayValue)), item.name];
              }}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "var(--chart-item-style)" }}
            />
            <ReferenceLine y={0} stroke="var(--chart-grid)" />
            {/* Invisible base bar */}
            <Bar dataKey="base" stackId="waterfall" fill="transparent" />
            {/* Visible value bar */}
            <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
