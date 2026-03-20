"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
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

interface RoasDailyChartProps {
  data: DailyDataPoint[];
  isLoading: boolean;
  roasTarget?: number;
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

export function RoasDailyChart({ data, isLoading, roasTarget = 4, chartHeight = 280, fillHeight = false }: RoasDailyChartProps) {
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Card className={fillHeight ? "h-full flex flex-col" : ""}>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className={fillHeight ? "flex-1 min-h-0" : ""}><Skeleton className="w-full" style={{ height: fillHeight ? "100%" : chartHeight }} /></CardContent>
      </Card>
    );
  }

  const chartData = data
    .map((d) => ({
      date: d.date,
      roas: d.adSpend > 0 ? parseFloat((d.revenue / d.adSpend).toFixed(2)) : null,
      revenue: d.revenue,
      adSpend: d.adSpend,
    }))
    .filter((d) => d.roas !== null);

  const maxRoas = Math.max(...chartData.map((d) => d.roas ?? 0), roasTarget * 1.5);

  return (
    <Card className={fillHeight ? "h-full flex flex-col" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">ROAS diario</CardTitle>
          <span className="text-[11px] text-muted-foreground">
            Target: <span className="text-amber-600 font-semibold">{roasTarget}x</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className={`${fillHeight ? "flex-1 min-h-0" : ""} rounded-lg`} style={{ backgroundColor: "var(--chart-bg)" }}>
        <ResponsiveContainer width="100%" height={fillHeight ? "100%" : chartHeight}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="roasGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.03} />
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
              tick={{ fontSize: 11, fill: "var(--chart-tick)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}x`}
              domain={[0, Math.ceil(maxRoas)]}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "ROAS") return [`${Number(value).toFixed(2)}x`, "ROAS"];
                if (name === "Ingresos") return [formatMoney(Number(value)), "Ingresos"];
                return [formatMoney(Number(value)), "Gasto Ads"];
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const raw = payload[0]?.payload;
                const date = new Date(label + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
                return (
                  <div style={TOOLTIP_STYLE} className="px-3 py-2 text-xs space-y-1">
                    <p className="text-muted-foreground font-medium mb-1">{date}</p>
                    <p className="text-violet-600 dark:text-violet-300">ROAS: <span className="font-semibold text-slate-800 dark:text-white">{raw?.roas != null ? `${Number(raw.roas).toFixed(2)}x` : "—"}</span></p>
                    <p className="text-amber-600 dark:text-amber-300">Target: <span className="font-semibold">{roasTarget}x</span></p>
                    <p className="text-emerald-600 dark:text-emerald-300">Ingresos: <span className="font-semibold text-slate-800 dark:text-white">{formatMoney(raw?.revenue ?? 0)}</span></p>
                    <p className="text-rose-600 dark:text-rose-300">Gasto Ads: <span className="font-semibold text-slate-800 dark:text-white">{formatMoney(raw?.adSpend ?? 0)}</span></p>
                  </div>
                );
              }}
              labelFormatter={(label) =>
                new Date(label + "T00:00:00").toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "short",
                })
              }
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: "var(--chart-item-style)" }}
              labelStyle={{ color: "var(--chart-label-style)", marginBottom: 4 }}
            />

            {/* Red zone below target */}
            <ReferenceArea
              y1={0}
              y2={roasTarget}
              fill="#ef4444"
              fillOpacity={0.05}
            />

            {/* Target line */}
            <ReferenceLine
              y={roasTarget}
              stroke="#fbbf24"
              strokeDasharray="5 3"
              strokeWidth={1.5}
            />

            <Area
              type="monotone"
              dataKey="roas"
              stroke="#a78bfa"
              strokeWidth={2}
              fill="url(#roasGradient)"
              name="ROAS"
              dot={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
