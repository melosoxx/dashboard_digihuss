"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  AreaChart,
  BarChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";
import { DollarSign, ShoppingCart, MousePointerClick, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DailyDataPoint {
  date: string;
  revenue: number;
  adSpend: number;
  orders: number;
  impressions: number;
  clicks: number;
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

type ViewMode = "revenue_vs_spend" | "cost_per_order" | "clicks_ctr" | "impressions";

const VIEWS: { key: ViewMode; label: string; icon: typeof DollarSign; description: string }[] = [
  { key: "revenue_vs_spend", label: "Ingresos vs Gasto", icon: DollarSign, description: "Comparación diaria" },
  { key: "cost_per_order", label: "Costo x Pedido", icon: ShoppingCart, description: "Eficiencia de conversión" },
  { key: "clicks_ctr", label: "Clicks & CTR", icon: MousePointerClick, description: "Rendimiento de anuncios" },
  { key: "impressions", label: "Alcance", icon: Eye, description: "Impresiones diarias" },
];

function formatDate(v: string) {
  return new Date(v + "T00:00:00").toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
  });
}

export function ConversionsDailyChart({ data, isLoading, fillHeight = false }: ConversionsDailyChartProps) {
  const [view, setView] = useState<ViewMode>("revenue_vs_spend");
  const { convert, currencySymbol, formatMoney } = useCurrency();

  const chartData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      costPerOrder: d.orders > 0 ? d.adSpend / d.orders : 0,
      ctr: d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0,
    }));
  }, [data]);

  // Compute summary KPIs per view
  const summary = useMemo(() => {
    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
    const totalSpend = data.reduce((s, d) => s + d.adSpend, 0);
    const totalOrders = data.reduce((s, d) => s + d.orders, 0);
    const totalImpressions = data.reduce((s, d) => s + d.impressions, 0);
    const totalClicks = data.reduce((s, d) => s + d.clicks, 0);
    const avgCostPerOrder = totalOrders > 0 ? totalSpend / totalOrders : 0;
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    return { totalRevenue, totalSpend, totalOrders, totalImpressions, totalClicks, avgCostPerOrder, avgCtr };
  }, [data]);

  if (isLoading) {
    return (
      <Card className={fillHeight ? "h-full flex flex-col py-0 gap-0" : "py-0 gap-0"}>
        <CardContent className={`p-4 ${fillHeight ? "flex-1 min-h-0" : ""}`}>
          <div className="flex gap-4 h-full">
            <div className="w-44 space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
            <Skeleton className="flex-1 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  function formatCompactCurrency(v: number): string {
    const c = convert(v);
    if (c >= 1_000_000) return `${currencySymbol}${(c / 1_000_000).toFixed(1)}M`;
    if (c >= 1_000) return `${currencySymbol}${(c / 1_000).toFixed(0)}k`;
    return `${currencySymbol}${c.toFixed(0)}`;
  }

  function formatCompactNumber(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    return `${v}`;
  }

  const renderChart = () => {
    const commonXAxis = (
      <XAxis
        dataKey="date"
        tick={{ fontSize: 10, fill: "var(--chart-tick)" }}
        tickLine={false}
        axisLine={{ stroke: "var(--chart-axis)" }}
        tickFormatter={formatDate}
        interval="preserveStartEnd"
      />
    );
    const grid = <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" />;

    switch (view) {
      case "revenue_vs_spend":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendGradientNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              {grid}
              {commonXAxis}
              <YAxis
                tick={{ fontSize: 10, fill: "var(--chart-tick)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactCurrency}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const raw = payload[0]?.payload;
                  return (
                    <div style={TOOLTIP_STYLE} className="px-3 py-2 text-xs space-y-1">
                      <p className="text-muted-foreground font-medium mb-1">{formatDate(String(label))}</p>
                      <p className="text-emerald-600 dark:text-emerald-300">Ingresos: <span className="font-semibold text-foreground">{formatMoney(raw.revenue)}</span></p>
                      <p className="text-amber-600 dark:text-amber-300">Gasto Ads: <span className="font-semibold text-foreground">{formatMoney(raw.adSpend)}</span></p>
                      <p className="text-muted-foreground">Margen: <span className="font-semibold text-foreground">{formatMoney(raw.revenue - raw.adSpend)}</span></p>
                    </div>
                  );
                }}
              />
              <Legend
                content={() => (
                  <div className="flex justify-center gap-4 text-[11px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-0.5 rounded" style={{ backgroundColor: "#10b981" }} />Ingresos</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-0.5 rounded" style={{ backgroundColor: "#f59e0b" }} />Gasto Ads</span>
                  </div>
                )}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGradient)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="adSpend" stroke="#f59e0b" fill="url(#spendGradientNew)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "cost_per_order":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="cpoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              {grid}
              {commonXAxis}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: "rgba(16, 185, 129, 0.7)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: "rgba(139, 92, 246, 0.7)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactCurrency}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const raw = payload[0]?.payload;
                  return (
                    <div style={TOOLTIP_STYLE} className="px-3 py-2 text-xs space-y-1">
                      <p className="text-muted-foreground font-medium mb-1">{formatDate(String(label))}</p>
                      <p className="text-emerald-600 dark:text-emerald-300">Pedidos: <span className="font-semibold text-foreground">{raw.orders}</span></p>
                      <p className="text-violet-600 dark:text-violet-300">Costo/Pedido: <span className="font-semibold text-foreground">{raw.orders > 0 ? formatMoney(raw.costPerOrder) : "—"}</span></p>
                      <p className="text-muted-foreground">Gasto total: <span className="font-semibold text-foreground">{formatMoney(raw.adSpend)}</span></p>
                    </div>
                  );
                }}
              />
              <Legend
                content={() => (
                  <div className="flex justify-center gap-4 text-[11px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#10b981" }} />Pedidos</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-0.5 rounded" style={{ backgroundColor: "#8b5cf6" }} />Costo/Pedido</span>
                  </div>
                )}
              />
              <Bar yAxisId="left" dataKey="orders" fill="#10b981" fillOpacity={0.8} radius={[3, 3, 0, 0]} maxBarSize={18} />
              <Area yAxisId="right" type="monotone" dataKey="costPerOrder" stroke="#8b5cf6" fill="url(#cpoGradient)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case "clicks_ctr":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              {grid}
              {commonXAxis}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: "rgba(59, 130, 246, 0.7)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: "rgba(234, 88, 12, 0.7)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toFixed(1)}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const raw = payload[0]?.payload;
                  return (
                    <div style={TOOLTIP_STYLE} className="px-3 py-2 text-xs space-y-1">
                      <p className="text-muted-foreground font-medium mb-1">{formatDate(String(label))}</p>
                      <p className="text-blue-600 dark:text-blue-300">Clicks: <span className="font-semibold text-foreground">{raw.clicks.toLocaleString("es-AR")}</span></p>
                      <p className="text-orange-600 dark:text-orange-300">CTR: <span className="font-semibold text-foreground">{raw.ctr.toFixed(2)}%</span></p>
                      <p className="text-muted-foreground">Impresiones: <span className="font-semibold text-foreground">{raw.impressions.toLocaleString("es-AR")}</span></p>
                    </div>
                  );
                }}
              />
              <Legend
                content={() => (
                  <div className="flex justify-center gap-4 text-[11px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#3b82f6" }} />Clicks</span>
                    <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-0.5 rounded" style={{ backgroundColor: "#ea580c" }} />CTR</span>
                  </div>
                )}
              />
              <Bar yAxisId="left" dataKey="clicks" fill="#3b82f6" fillOpacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={18} />
              <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="#ea580c" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case "impressions":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              {grid}
              {commonXAxis}
              <YAxis
                tick={{ fontSize: 10, fill: "var(--chart-tick)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactNumber}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const raw = payload[0]?.payload;
                  return (
                    <div style={TOOLTIP_STYLE} className="px-3 py-2 text-xs space-y-1">
                      <p className="text-muted-foreground font-medium mb-1">{formatDate(String(label))}</p>
                      <p className="text-indigo-600 dark:text-indigo-300">Impresiones: <span className="font-semibold text-foreground">{raw.impressions.toLocaleString("es-AR")}</span></p>
                      <p className="text-muted-foreground">Clicks: <span className="font-semibold text-foreground">{raw.clicks.toLocaleString("es-AR")}</span></p>
                    </div>
                  );
                }}
              />
              <Legend
                content={() => (
                  <div className="flex justify-center gap-4 text-[11px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-0.5 rounded" style={{ backgroundColor: "#6366f1" }} />Impresiones</span>
                  </div>
                )}
              />
              <Area type="monotone" dataKey="impressions" stroke="#6366f1" fill="url(#impressionsGradient)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  const currentView = VIEWS.find((v) => v.key === view)!;

  // Summary KPI for the selected view
  const renderKpi = () => {
    switch (view) {
      case "revenue_vs_spend":
        return (
          <div className="flex gap-3 text-xs">
            <div><span className="text-muted-foreground">Ingresos:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(summary.totalRevenue)}</span></div>
            <div><span className="text-muted-foreground">Gasto:</span> <span className="font-semibold text-amber-600 dark:text-amber-400">{formatMoney(summary.totalSpend)}</span></div>
          </div>
        );
      case "cost_per_order":
        return (
          <div className="flex gap-3 text-xs">
            <div><span className="text-muted-foreground">Promedio:</span> <span className="font-semibold text-violet-600 dark:text-violet-400">{formatMoney(summary.avgCostPerOrder)}</span></div>
            <div><span className="text-muted-foreground">Pedidos:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{summary.totalOrders}</span></div>
          </div>
        );
      case "clicks_ctr":
        return (
          <div className="flex gap-3 text-xs">
            <div><span className="text-muted-foreground">Clicks:</span> <span className="font-semibold text-blue-600 dark:text-blue-400">{summary.totalClicks.toLocaleString("es-AR")}</span></div>
            <div><span className="text-muted-foreground">CTR:</span> <span className="font-semibold text-orange-600 dark:text-orange-400">{summary.avgCtr.toFixed(2)}%</span></div>
          </div>
        );
      case "impressions":
        return (
          <div className="flex gap-3 text-xs">
            <div><span className="text-muted-foreground">Total:</span> <span className="font-semibold text-indigo-600 dark:text-indigo-400">{summary.totalImpressions.toLocaleString("es-AR")}</span></div>
            <div><span className="text-muted-foreground">Prom/día:</span> <span className="font-semibold text-indigo-600 dark:text-indigo-400">{data.length > 0 ? Math.round(summary.totalImpressions / data.length).toLocaleString("es-AR") : 0}</span></div>
          </div>
        );
    }
  };

  return (
    <Card className={cn("py-0 gap-0", fillHeight && "h-full flex flex-col")}>
      <CardContent className={cn("p-3", fillHeight && "flex-1 min-h-0 flex flex-col")}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{currentView.label}</h3>
            <p className="text-[11px] text-muted-foreground">{currentView.description}</p>
          </div>
          {renderKpi()}
        </div>

        {/* Body: sidebar + chart */}
        <div className="flex gap-3 flex-1 min-h-0">
          {/* Left sidebar buttons */}
          <div className="flex flex-col gap-1.5 w-[52px] flex-shrink-0">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              const isActive = view === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setView(v.key)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg text-[9px] leading-tight text-center transition-all duration-150 cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="leading-[1.1]">{v.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Chart */}
          <div className="flex-1 min-w-0 min-h-0 rounded-lg" style={{ backgroundColor: "var(--chart-bg)" }}>
            {renderChart()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
