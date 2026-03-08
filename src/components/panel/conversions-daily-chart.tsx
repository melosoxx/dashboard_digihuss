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
  ReferenceLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  /** Target cost per conversion in raw currency (ARS) */
  costTarget?: number;
}

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15, 20, 35, 0.95)",
  border: "1px solid rgba(100, 120, 180, 0.2)",
  borderRadius: "10px",
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
};

export function ConversionsDailyChart({ data, isLoading, costTarget = 2000 }: ConversionsDailyChartProps) {
  const { convert, currencySymbol, formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-[280px] w-full" /></CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date,
    orders: d.orders,
    costPerConversion: d.orders > 0 ? d.adSpend / d.orders : null,
    adSpend: d.adSpend,
    revenue: d.revenue,
  }));

  function formatCostAxis(v: number): string {
    const c = convert(v);
    if (c >= 1_000) return `${currencySymbol}${(c / 1_000).toFixed(0)}k`;
    return `${currencySymbol}${c.toFixed(0)}`;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Conversiones diarias</CardTitle>
          <span className="text-[11px] text-muted-foreground">
            Target CPC: <span className="text-amber-400 font-semibold">{formatMoney(costTarget)}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 120, 180, 0.08)" vertical={false} />
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
              yAxisId="left"
              tick={{ fontSize: 11, fill: "rgba(150, 165, 200, 0.6)" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(v) => `${v}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "rgba(251, 191, 36, 0.7)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCostAxis}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const raw = payload[0]?.payload;
                const date = new Date(label + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
                const cpc = raw?.costPerConversion != null ? formatMoney(raw.costPerConversion) : "—";
                return (
                  <div style={TOOLTIP_STYLE} className="px-3 py-2 text-xs space-y-1">
                    <p className="text-muted-foreground font-medium mb-1">{date}</p>
                    <p className="text-emerald-400">Pedidos: <span className="font-semibold text-white">{raw?.orders ?? 0}</span></p>
                    <p className="text-amber-300">Costo/conv.: <span className="font-semibold text-white">{cpc}</span></p>
                    <p className="text-amber-400">Target CPC: <span className="font-semibold">{formatMoney(costTarget)}</span></p>
                    <p className="text-rose-400">Gasto Ads: <span className="font-semibold text-white">{formatMoney(raw?.adSpend ?? 0)}</span></p>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "rgba(150, 165, 200, 0.7)" }}
            />

            {/* Target cost per conversion */}
            <ReferenceLine
              yAxisId="right"
              y={costTarget}
              stroke="#fbbf24"
              strokeDasharray="5 3"
              strokeWidth={1.5}
            />

            <Bar
              yAxisId="left"
              dataKey="orders"
              fill="#10b981"
              fillOpacity={0.75}
              radius={[3, 3, 0, 0]}
              name="Pedidos"
              maxBarSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="costPerConversion"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              name="Costo/conv."
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
