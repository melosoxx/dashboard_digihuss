"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClarityDailyDataPoint } from "@/types/clarity";

interface SessionsDailyChartProps {
  data: ClarityDailyDataPoint[];
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

export function SessionsDailyChart({ data, isLoading, chartHeight = 280, fillHeight = false }: SessionsDailyChartProps) {
  if (isLoading) {
    return (
      <Card className={fillHeight ? "h-full flex flex-col" : ""}>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className={fillHeight ? "flex-1 min-h-0" : ""}><Skeleton className="w-full" style={{ height: fillHeight ? "100%" : chartHeight }} /></CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={fillHeight ? "h-full flex flex-col" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Sesiones por día</CardTitle>
        </CardHeader>
        <CardContent className={`flex items-center justify-center text-sm text-muted-foreground ${fillHeight ? "flex-1 min-h-0" : ""}`} style={fillHeight ? undefined : { height: chartHeight }}>
          Sin datos de sesiones para este periodo.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={fillHeight ? "h-full flex flex-col" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Sesiones por día</CardTitle>
      </CardHeader>
      <CardContent className={fillHeight ? "flex-1 min-h-0" : ""}>
        <ResponsiveContainer width="100%" height={fillHeight ? "100%" : chartHeight}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
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
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const raw = payload[0]?.payload as ClarityDailyDataPoint;
                const date = new Date(label + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
                const breakdown = raw?.profileBreakdown;
                return (
                  <div style={TOOLTIP_STYLE} className="px-3 py-2 text-xs space-y-1">
                    <p className="text-muted-foreground font-medium mb-1">{date}</p>
                    <p className="text-blue-600 dark:text-blue-300">Sesiones: <span className="font-semibold text-slate-800 dark:text-white">{raw?.sessions ?? 0}</span></p>
                    {breakdown && breakdown.length > 1 && (
                      <div className="pt-1 mt-1 border-t border-white/10 space-y-0.5">
                        {breakdown.map((p) => (
                          <div key={p.profileName} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.profileColor }} />
                            <span className="text-muted-foreground">{p.profileName}:</span>
                            <span className="font-semibold text-slate-800 dark:text-white">{p.sessions}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="sessions"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#sessionsGradient)"
              dot={false}
              name="Sesiones"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}