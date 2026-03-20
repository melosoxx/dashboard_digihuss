"use client";

import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";

interface DailyDataPoint {
  date: string;
  revenue: number;
  adSpend: number;
  orders: number;
}

interface ConversionsDailyChartProps {
  data: DailyDataPoint[];
  isLoading: boolean;
  chartHeight?: number;
  fillHeight?: boolean;
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--tooltip-bg)",
  border: "var(--tooltip-border)",
  borderRadius: "10px",
  backdropFilter: "blur(8px)",
  boxShadow: "var(--tooltip-shadow)",
  color: "var(--tooltip-color)",
};

export function ConversionsDailyChart({ data, isLoading, chartHeight = 280, fillHeight = false }: ConversionsDailyChartProps) {
  const { convert, currencySymbol, formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Card className={fillHeight ? "h-full flex flex-col" : ""}>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className={fillHeight ? "flex-1 min-h-0" : ""}><Skeleton className="w-full" style={{ height: fillHeight ? "100%" : chartHeight }} /></CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date,
    orders: d.orders,
    adSpend: d.adSpend,
  }));

  function formatCostAxis(v: number): string {
    const c = convert(v);
    if (c >= 1_000) return `${currencySymbol}${(c / 1_000).toFixed(0)}k`;
    return `${currencySymbol}${c.toFixed(0)}`;
  }

  return (
    <Card className={fillHeight ? "h-full flex flex-col" : ""}>
      <CardContent className={`${fillHeight ? "flex-1 min-h-0" : ""} rounded-lg`} style={{ backgroundColor: "var(--chart-bg)" }}>
        <ResponsiveContainer width="100%" height={fillHeight ? "100%" : chartHeight}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" />
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
              yAxisId="left"
              domain={[0, 10]}
              tick={{ fontSize: 11, fill: "rgba(16, 185, 129, 0.7)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 30000]}
              ticks={[0, 10000, 20000, 30000]}
              tick={{ fontSize: 11, fill: "rgba(239, 68, 68, 0.7)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCostAxis}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const raw = payload[0]?.payload;
                const date = new Date(label + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
                const orders = raw?.orders ?? 0;
                const spend = raw?.adSpend ?? 0;
                const cpc = orders > 0 ? formatMoney(spend / orders) : "—";
                return (
                  <div style={TOOLTIP_STYLE} className="px-3 py-2 text-xs space-y-1">
                    <p className="text-muted-foreground font-medium mb-1">{date}</p>
                    <p className="text-rose-600 dark:text-rose-300">Gasto: <span className="font-semibold text-slate-800 dark:text-white">{formatMoney(spend)}</span></p>
                    <p className="text-emerald-600 dark:text-emerald-300">Pedidos: <span className="font-semibold text-slate-800 dark:text-white">{orders}</span></p>
                    <p className="text-muted-foreground">Costo/conv.: <span className="font-semibold text-slate-800 dark:text-white">{cpc}</span></p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "rgba(100, 116, 139, 0.7)" }}
              content={() => (
                <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#10b981" }} />Pedidos</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-0.5 rounded" style={{ backgroundColor: "#ef4444" }} />Gasto Ads</span>
                </div>
              )}
            />

            <Area
              yAxisId="right"
              type="monotone"
              dataKey="adSpend"
              stroke="#ef4444"
              fill="url(#spendGradient)"
              strokeWidth={2}
              dot={false}
              name="Gasto Ads"
            />
            <Bar
              yAxisId="left"
              dataKey="orders"
              fill="#10b981"
              fillOpacity={1}
              radius={[3, 3, 0, 0]}
              name="Pedidos"
              maxBarSize={20}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
