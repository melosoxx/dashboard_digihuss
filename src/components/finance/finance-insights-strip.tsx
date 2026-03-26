"use client";

import { AlertTriangle, TrendingUp, Info, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  label: string;
  type: "success" | "warning" | "info";
  icon: React.ComponentType<{ className?: string }>;
}

interface FinanceInsightsStripProps {
  profitMargin: number;
  mpFees: number;
  grossRevenue: number;
  adSpend: number;
  totalExpenses: number;
  recurringExpenses: number;
  mpNetRevenue: number;
}

export function FinanceInsightsStrip({
  profitMargin,
  mpFees,
  grossRevenue,
  adSpend,
  totalExpenses,
  recurringExpenses,
  mpNetRevenue,
}: FinanceInsightsStripProps) {
  const insights: Insight[] = [];

  // Margin alert
  if (profitMargin < 15 && totalExpenses > 0) {
    insights.push({
      label: profitMargin < 0
        ? `Margen negativo: ${profitMargin.toFixed(1)}%`
        : `Margen bajo: ${profitMargin.toFixed(1)}%`,
      type: "warning",
      icon: AlertTriangle,
    });
  } else if (profitMargin >= 25) {
    insights.push({
      label: `Margen saludable: ${profitMargin.toFixed(1)}%`,
      type: "success",
      icon: TrendingUp,
    });
  }

  // MP fees as % of gross
  if (grossRevenue > 0 && mpFees > 0) {
    const feesPct = (mpFees / grossRevenue) * 100;
    insights.push({
      label: `Comisiones MP = ${feesPct.toFixed(1)}% del bruto`,
      type: "info",
      icon: Percent,
    });
  }

  // Ad spend as % of expenses
  if (totalExpenses > 0 && adSpend > 0) {
    const adPct = (adSpend / totalExpenses) * 100;
    insights.push({
      label: `Publicidad = ${adPct.toFixed(0)}% de egresos`,
      type: adPct > 60 ? "warning" : "info",
      icon: Info,
    });
  }

  // Fixed costs as % of revenue
  if (mpNetRevenue > 0 && recurringExpenses > 0) {
    const fixedPct = (recurringExpenses / mpNetRevenue) * 100;
    insights.push({
      label: `Gastos fijos = ${fixedPct.toFixed(0)}% del ingreso`,
      type: fixedPct > 40 ? "warning" : "success",
      icon: fixedPct > 40 ? AlertTriangle : TrendingUp,
    });
  }

  if (insights.length === 0) return null;

  const typeStyles = {
    success: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    warning: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    info: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20",
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {insights.map((insight) => {
        const Icon = insight.icon;
        return (
          <div
            key={insight.label}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap flex-none",
              typeStyles[insight.type]
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {insight.label}
          </div>
        );
      })}
    </div>
  );
}
