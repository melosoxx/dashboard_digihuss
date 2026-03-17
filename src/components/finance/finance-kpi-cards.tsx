"use client";

import { DollarSign, TrendingDown, Wallet, Percent, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import type { FinanceSummary } from "@/types/finance";

interface FinanceKPICardsProps {
  data: FinanceSummary | null | undefined;
  isLoading: boolean;
}

/* ── Shared KPI wrapper with popover ── */
function KPIWithPopover({
  title,
  formattedValue,
  icon: Icon,
  iconClassName,
  isLoading,
  children,
}: {
  title: string;
  formattedValue: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
  isLoading: boolean;
  children?: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="px-2.5 py-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  const bgColor = iconClassName?.includes("emerald")
    ? "bg-emerald-500/10"
    : iconClassName?.includes("red")
    ? "bg-red-500/10"
    : iconClassName?.includes("teal")
    ? "bg-teal-500/10"
    : "bg-muted";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card className="overflow-hidden cursor-pointer hover:border-primary/30 transition-colors">
          <CardContent className="px-2.5 py-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {title}
                </span>
                <Info className="h-2.5 w-2.5 text-muted-foreground/50" />
              </div>
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md",
                  bgColor
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", iconClassName)} />
              </div>
            </div>
            <div className="text-lg font-bold tracking-tight">
              {formattedValue}
            </div>
          </CardContent>
        </Card>
      </PopoverTrigger>
      {children && (
        <PopoverContent className="w-80 p-3">{children}</PopoverContent>
      )}
    </Popover>
  );
}

/* ── Popover line item ── */
function LineItem({
  label,
  amount,
  color,
  percentage,
  prefix,
  formatMoney,
}: {
  label: string;
  amount: number;
  color?: string;
  percentage?: number;
  prefix?: "+" | "-" | "=";
  formatMoney: (n: number) => string;
}) {
  return (
    <div className="flex items-center justify-between text-xs py-0.5">
      <div className="flex items-center gap-1.5 min-w-0">
        {color && (
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        {prefix && (
          <span
            className={cn(
              "font-mono shrink-0",
              prefix === "+" && "text-emerald-500",
              prefix === "-" && "text-red-600",
              prefix === "=" && "text-muted-foreground"
            )}
          >
            {prefix}
          </span>
        )}
        <span className="text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-medium">{formatMoney(amount)}</span>
        {percentage !== undefined && (
          <span className="text-muted-foreground/60 w-10 text-right">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Main component ── */
export function FinanceKPICards({ data, isLoading }: FinanceKPICardsProps) {
  const { formatMoney } = useCurrency();

  const mpNetRevenue = data?.mpNetRevenue ?? 0;
  const totalExpenses = data?.totalExpenses ?? 0;
  const netProfit = data?.netProfit ?? 0;
  const profitMargin = data?.profitMargin ?? 0;
  const adSpend = data?.adSpend ?? 0;
  const mpFees = data?.mpFees ?? 0;
  const manualExpenses = data?.manualExpenses ?? 0;
  const recurringExpenses = data?.recurringExpenses ?? 0;
  const otherExpenses = manualExpenses + recurringExpenses;

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
      {/* ── Ingresos Netos (Post-Comisiones) ── */}
      <KPIWithPopover
        title="Ingresos Netos"
        formattedValue={formatMoney(mpNetRevenue)}
        icon={DollarSign}
        iconClassName="text-emerald-500"
        isLoading={isLoading}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Composicion
        </p>
        <LineItem
          label="Bruto MercadoPago"
          amount={data?.mpSummary?.grossAmount ?? 0}
          color="#10b981"
          formatMoney={formatMoney}
        />
        <LineItem
          prefix="-"
          label="Comisiones MP"
          amount={mpFees}
          color="#f59e0b"
          formatMoney={formatMoney}
        />
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1">
            <span className="font-mono text-muted-foreground">=</span>
            Neto recibido
          </span>
          <span className="text-emerald-500">{formatMoney(mpNetRevenue)}</span>
        </div>
        <Separator className="my-2" />
        <p className="text-[10px] text-muted-foreground">
          Monto neto depositado por MercadoPago despues de comisiones, cuotas e impuestos.
        </p>
      </KPIWithPopover>

      {/* ── Egresos Totales ── */}
      <KPIWithPopover
        title="Egresos Totales"
        formattedValue={formatMoney(totalExpenses)}
        icon={TrendingDown}
        iconClassName="text-red-500"
        isLoading={isLoading}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Composicion
        </p>
        {adSpend > 0 && (
          <LineItem
            label="Publicidad (Meta Ads)"
            amount={adSpend}
            color="#f43f5e"
            percentage={totalExpenses > 0 ? (adSpend / totalExpenses) * 100 : 0}
            formatMoney={formatMoney}
          />
        )}
        {manualExpenses > 0 && (
          <LineItem
            label="Gastos Manuales"
            amount={manualExpenses}
            color="#6b7280"
            percentage={
              totalExpenses > 0 ? (manualExpenses / totalExpenses) * 100 : 0
            }
            formatMoney={formatMoney}
          />
        )}
        {recurringExpenses > 0 && (
          <LineItem
            label="Gastos Recurrentes"
            amount={recurringExpenses}
            color="#8b5cf6"
            percentage={
              totalExpenses > 0 ? (recurringExpenses / totalExpenses) * 100 : 0
            }
            formatMoney={formatMoney}
          />
        )}
        {totalExpenses === 0 && (
          <p className="text-xs text-muted-foreground">
            No hay egresos registrados en este periodo.
          </p>
        )}
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-xs font-medium">
          <span>Total</span>
          <span>{formatMoney(totalExpenses)}</span>
        </div>
      </KPIWithPopover>

      {/* ── Ganancia Neta ── */}
      <KPIWithPopover
        title="Ganancia Neta"
        formattedValue={formatMoney(netProfit)}
        icon={Wallet}
        iconClassName={netProfit >= 0 ? "text-emerald-500" : "text-red-500"}
        isLoading={isLoading}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Calculo
        </p>
        <LineItem prefix="+" label="Ingresos Netos (MP)" amount={mpNetRevenue} formatMoney={formatMoney} />
        {adSpend > 0 && (
          <LineItem prefix="-" label="Publicidad" amount={adSpend} formatMoney={formatMoney} />
        )}
        {otherExpenses > 0 && (
          <LineItem prefix="-" label="Otros Gastos" amount={otherExpenses} formatMoney={formatMoney} />
        )}
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-1">
            <span className="font-mono text-muted-foreground">=</span>
            Ganancia Neta
          </span>
          <span className={netProfit >= 0 ? "text-emerald-500" : "text-red-600 dark:text-red-400"}>
            {formatMoney(netProfit)}
          </span>
        </div>
      </KPIWithPopover>

      {/* ── Margen Neto ── */}
      <KPIWithPopover
        title="Margen Neto"
        formattedValue={`${profitMargin.toFixed(1)}%`}
        icon={Percent}
        iconClassName="text-teal-500"
        isLoading={isLoading}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Formula
        </p>
        <div className="text-xs space-y-1">
          <p className="text-muted-foreground">
            Ganancia Neta / Ingresos Netos x 100
          </p>
          <p className="font-mono text-xs">
            {formatMoney(netProfit)} / {formatMoney(mpNetRevenue)} x 100
          </p>
          <Separator className="my-2" />
          <p className="font-bold text-teal-500 text-sm">
            = {profitMargin.toFixed(1)}%
          </p>
        </div>
      </KPIWithPopover>
    </div>
  );
}