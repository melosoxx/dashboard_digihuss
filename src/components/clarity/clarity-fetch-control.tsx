"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Info, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClarityFetchControlProps {
  isFetching: boolean;
  isManualFetching: boolean;
  hasData: boolean;
  lastFetchedAt: string | null;
  daysAvailable: number;
  availableDates: string[];
  rangeStart: string;
  rangeEnd: string;
  rateLimited: boolean;
  onFetchToday: () => void;
}

function formatLastFetch(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTodayAR(): string {
  return new Date()
    .toLocaleString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })
    .slice(0, 10);
}

/** Get the Monday of the week containing the given date string */
function getMonday(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

/** Get Mon-Fri date strings for a week starting at the given Monday */
function getWeekdays(monday: Date): string[] {
  const days: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function formatWeekLabel(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d: Date) =>
    `${d.getDate()}/${d.getMonth() + 1}`;
  return `${fmt(monday)} — ${fmt(friday)}`;
}

export function ClarityWeekStrip({
  availableDates,
  rangeStart,
  rangeEnd,
  large = false,
}: {
  availableDates: string[];
  rangeStart: string;
  rangeEnd: string;
  large?: boolean;
}) {
  const available = new Set(availableDates);
  const today = getTodayAR();

  // Calculate total weeks in range
  const firstMonday = getMonday(rangeStart);
  const lastMonday = getMonday(rangeEnd);
  const totalWeeks = useMemo(() => {
    const diffMs = lastMonday.getTime() - firstMonday.getTime();
    return Math.round(diffMs / (7 * 86400000)) + 1;
  }, [firstMonday.getTime(), lastMonday.getTime()]);

  // Start on the last week (most recent)
  const [weekOffset, setWeekOffset] = useState(totalWeeks - 1);

  const currentMonday = useMemo(() => {
    const m = new Date(firstMonday);
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [firstMonday.getTime(), weekOffset]);

  const weekdays = useMemo(() => getWeekdays(currentMonday), [currentMonday.getTime()]);

  const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

  return (
    <div className={cn("flex items-center", large ? "gap-4" : "gap-1.5")}>
      {/* Left arrow */}
      <button
        onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
        disabled={weekOffset === 0}
        className={cn(
          "rounded hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0",
          large ? "p-2" : "p-0.5"
        )}
      >
        <ChevronLeft className={cn(large ? "h-6 w-6" : "h-3.5 w-3.5", "text-muted-foreground")} />
      </button>

      {/* Week label — hidden in large mode */}
      {!large && (
        <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap flex-shrink-0">
          {formatWeekLabel(currentMonday)}
        </span>
      )}

      {/* Day cells inline */}
      <div className={cn("flex items-center", large ? "gap-3" : "gap-1")}>
        {weekdays.map((date, i) => {
          const hasData = available.has(date);
          const isToday = date === today;
          const dayNum = new Date(date + "T00:00:00").getDate();
          return (
            <Tooltip key={date}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex flex-col items-center justify-center rounded font-medium cursor-default select-none",
                    large
                      ? "w-16 h-16 text-sm gap-0.5"
                      : "w-9 h-9 text-[10px]",
                    hasData
                      ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                      : "bg-muted/20 text-muted-foreground/40 border border-border/10",
                    isToday && "ring-1 ring-cyan-500/60"
                  )}
                >
                  <span className={cn(
                    "text-muted-foreground/50 leading-none",
                    large ? "text-[10px]" : "text-[8px]"
                  )}>{DAY_LABELS[i]}</span>
                  <span className={cn("leading-none", large && "text-lg font-bold")}>{dayNum}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[11px]">
                {date} — {hasData ? "Con datos" : "Sin datos"}
                {isToday ? " · Hoy" : ""}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => setWeekOffset((o) => Math.min(totalWeeks - 1, o + 1))}
        disabled={weekOffset >= totalWeeks - 1}
        className={cn(
          "rounded hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0",
          large ? "p-2" : "p-0.5"
        )}
      >
        <ChevronRight className={cn(large ? "h-6 w-6" : "h-3.5 w-3.5", "text-muted-foreground")} />
      </button>

      {/* Legend — hidden in large mode */}
      {!large && (
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm bg-emerald-500/20 border border-emerald-500/30" />
            <span className="text-[10px] text-muted-foreground">{availableDates.length} días</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ClarityFetchControl({
  isFetching,
  isManualFetching,
  hasData,
  lastFetchedAt,
  daysAvailable,
  availableDates,
  rangeStart,
  rangeEnd,
  rateLimited,
  onFetchToday,
}: ClarityFetchControlProps) {
  const isWorking = isFetching || isManualFetching;

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/90">
              Microsoft Clarity
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[240px] p-3">
                <p className="font-medium mb-1">Recoleccion automatica</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Los datos de Clarity se recolectan automaticamente todos los
                  dias a las 23:59. Podes usar el boton para actualizar los
                  datos de hoy manualmente si es necesario.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Rate limit warning */}
          {rateLimited && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-[11px] text-red-600 dark:text-red-400">
                Limite diario alcanzado. Se reinicia a medianoche UTC.
              </p>
            </div>
          )}

          {/* Week strip */}
          <ClarityWeekStrip
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            availableDates={availableDates}
          />

          {/* Manual fetch button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={hasData ? "outline" : "default"}
                size="sm"
                className="w-full"
                disabled={isWorking || rateLimited}
                onClick={onFetchToday}
              >
                {isManualFetching ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Actualizar hoy
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">
              Consultar API de Clarity para el dia de hoy (consume 1 call)
            </TooltipContent>
          </Tooltip>

          {lastFetchedAt && (
            <p className="text-[10px] text-muted-foreground text-center">
              Ultima actualizacion: {formatLastFetch(lastFetchedAt)}
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
