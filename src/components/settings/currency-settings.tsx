"use client";

import { RefreshCw, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCurrency, CURRENCIES, type CurrencyCode } from "@/providers/currency-provider";

const CURRENCY_FLAGS: Record<CurrencyCode, string> = {
  ARS: "🇦🇷",
  USD: "🇺🇸",
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "hace menos de 1 minuto";
  if (diffMin === 1) return "hace 1 minuto";
  if (diffMin < 60) return `hace ${diffMin} minutos`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return "hace 1 hora";
  return `hace ${diffHr} horas`;
}

function RateRow({
  code,
  rateFromARS,
  isActive,
}: {
  code: CurrencyCode;
  rateFromARS: number;
  isActive: boolean;
}) {
  const cfg = CURRENCIES[code];
  const inverseRate = rateFromARS > 0 ? 1 / rateFromARS : 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
        isActive
          ? "bg-primary/5 ring-1 ring-primary/20"
          : "hover:bg-muted/40"
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-base leading-none">{CURRENCY_FLAGS[code]}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold">{code}</span>
          <span className="text-xs text-muted-foreground">{cfg.symbol}</span>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">{cfg.label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-medium tabular-nums">
          {inverseRate > 0
            ? inverseRate.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "—"}
        </span>
        <span className="text-xs text-muted-foreground ml-1">ARS</span>
      </div>
    </div>
  );
}

export function CurrencySettings() {
  const {
    currency,
    setCurrency,
    rates,
    ratesTimestamp,
    ratesError,
    isLoadingRates,
    refreshRates,
  } = useCurrency();

  const allCurrencies = Object.keys(CURRENCIES) as CurrencyCode[];
  const otherCurrencies = allCurrencies.filter((c) => c !== "ARS");

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-semibold">Moneda de Visualización</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Los valores del dashboard se convierten automáticamente. Los datos originales se mantienen en ARS.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshRates}
            disabled={isLoadingRates}
            className="shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isLoadingRates ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Segmented currency selector */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border/50">
          {allCurrencies.map((code) => {
            const cfg = CURRENCIES[code];
            const isActive = currency === code;
            return (
              <button
                key={code}
                onClick={() => setCurrency(code)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <span className="text-sm leading-none">{CURRENCY_FLAGS[code]}</span>
                <span className="font-semibold">{code}</span>
                <span className="hidden sm:inline text-[11px] opacity-70">{cfg.symbol}</span>
              </button>
            );
          })}
        </div>

        {/* Error banner */}
        {ratesError && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            No se pudieron actualizar las cotizaciones. Usando última cotización disponible.
          </div>
        )}

        {/* Rates */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
            Cotizaciones actuales
          </p>
          {isLoadingRates ? (
            <div className="space-y-1">
              {otherCurrencies.map((c) => (
                <div key={c} className="flex justify-between items-center px-3 py-2.5 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0.5">
              {otherCurrencies.map((c) => (
                <RateRow
                  key={c}
                  code={c}
                  rateFromARS={rates[c] ?? 0}
                  isActive={currency === c}
                />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {ratesTimestamp && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
            Última actualización: {formatRelativeTime(ratesTimestamp)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
