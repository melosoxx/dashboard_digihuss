"use client";

import { TrendingUp, Target, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";

interface ProjectionCardProps {
  mpNetRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  dayCount: number;
  isLoading: boolean;
}

export function ProjectionCard({
  mpNetRevenue,
  totalExpenses,
  netProfit,
  profitMargin,
  dayCount,
  isLoading,
}: ProjectionCardProps) {
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <div className="h-full grid gap-2 grid-cols-1 lg:grid-cols-2">
        <Card><CardContent className="py-6"><Skeleton className="h-[140px] w-full" /></CardContent></Card>
        <Card><CardContent className="py-6"><Skeleton className="h-[140px] w-full" /></CardContent></Card>
      </div>
    );
  }

  const dailyRevenue = dayCount > 0 ? mpNetRevenue / dayCount : 0;
  const dailyExpenses = dayCount > 0 ? totalExpenses / dayCount : 0;
  const projectedRevenue = dailyRevenue * 30;
  const projectedExpenses = dailyExpenses * 30;
  const projectedProfit = projectedRevenue - projectedExpenses;
  const projectedMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;
  const breakEvenDaily = dailyExpenses;

  return (
    <div className="h-full grid gap-2 grid-cols-1 lg:grid-cols-2">
      {/* Monthly Projection */}
      <Card className="flex flex-col">
        <CardHeader className="py-3 flex-shrink-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-500" />
            Proyeccion Mensual (30 dias)
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">
            Basado en los {dayCount} dias del periodo seleccionado
          </p>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Ingresos Proy.
              </p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(projectedRevenue)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Egresos Proy.
              </p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {formatMoney(projectedExpenses)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Ganancia Proy.
              </p>
              <p className={cn(
                "text-lg font-bold",
                projectedProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {formatMoney(projectedProfit)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Margen Proy.
              </p>
              <p className={cn(
                "text-lg font-bold",
                projectedMargin >= 20 ? "text-emerald-600 dark:text-emerald-400"
                  : projectedMargin >= 10 ? "text-amber-600 dark:text-amber-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {projectedMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Break-even */}
      <Card className="flex flex-col">
        <CardHeader className="py-3 flex-shrink-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-sky-500" />
            Punto de Equilibrio
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-4 flex flex-col justify-center">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Ingreso diario necesario
              </p>
              <p className="text-2xl font-bold">{formatMoney(breakEvenDaily)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                para cubrir todos los gastos del periodo
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-xs">
                <span className="text-muted-foreground">Ingreso diario actual: </span>
                <span className={cn(
                  "font-semibold",
                  dailyRevenue >= breakEvenDaily ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {formatMoney(dailyRevenue)}
                </span>
                {dailyRevenue >= breakEvenDaily ? (
                  <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                    (+{((dailyRevenue / breakEvenDaily - 1) * 100).toFixed(0)}% sobre equilibrio)
                  </span>
                ) : breakEvenDaily > 0 ? (
                  <span className="text-red-600 dark:text-red-400 ml-1">
                    ({((1 - dailyRevenue / breakEvenDaily) * 100).toFixed(0)}% debajo)
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
