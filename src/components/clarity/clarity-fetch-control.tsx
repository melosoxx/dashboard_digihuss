"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Zap, Info, Clock, Database, CalendarDays } from "lucide-react";

interface ClarityFetchControlProps {
  remaining: number;
  max: number;
  exhausted: boolean;
  isFetching: boolean;
  isLoadingCache: boolean;
  hasData: boolean;
  fetchedAt: string | null;
  periodLabel: string;
  onLoadCache: () => void;
  onFetch: () => void;
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

export function ClarityFetchControl({
  remaining,
  max,
  exhausted,
  isFetching,
  isLoadingCache,
  hasData,
  fetchedAt,
  periodLabel,
  onLoadCache,
  onFetch,
}: ClarityFetchControlProps) {
  const used = max - remaining;
  const fillPct = (used / max) * 100;

  const barColor = exhausted
    ? "bg-red-500"
    : remaining <= 3
    ? "bg-amber-500"
    : "bg-emerald-500";

  const textColor = exhausted
    ? "text-red-400"
    : remaining <= 3
    ? "text-amber-400"
    : "text-emerald-400";

  const isWorking = isFetching || isLoadingCache;

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Header with info tooltip */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Microsoft Clarity
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[240px] p-3">
                <p className="font-medium mb-1">Como funciona Clarity</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Microsoft Clarity tiene un limite de 10 consultas diarias a su API.
                  Los datos se guardan en cache y se cargan automaticamente al recargar.
                  El contador se reinicia a medianoche UTC.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Data info panel */}
          <div className="rounded-md bg-muted/50 px-2.5 py-2 space-y-1.5">
            {fetchedAt ? (
              <>
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3 text-blue-400 shrink-0" />
                  <span className="text-[11px] font-medium text-foreground/80">
                    Periodo: {periodLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-[10px] text-muted-foreground">
                    Obtenidos: {formatLastFetch(fetchedAt)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <Database className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <span className="text-[11px] text-muted-foreground/70">
                  No hay datos guardados
                </span>
              </div>
            )}
          </div>

          {/* Quota display */}
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground">
                  Calls disponibles
                </span>
                <span className={`text-xs font-bold ${textColor}`}>
                  {remaining}/{max}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Load cache button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={isWorking}
                  onClick={onLoadCache}
                >
                  {isLoadingCache ? (
                    <>
                      <Database className="mr-1.5 h-3 w-3 animate-spin" />
                      <span className="text-[11px]">Cargando...</span>
                    </>
                  ) : (
                    <>
                      <Database className="mr-1.5 h-3 w-3" />
                      <span className="text-[11px]">Guardados</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px]">
                Cargar datos guardados (no consume calls)
              </TooltipContent>
            </Tooltip>

            {/* Fetch fresh button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasData ? "outline" : "default"}
                  size="sm"
                  className="flex-1"
                  disabled={exhausted || isWorking}
                  onClick={onFetch}
                >
                  {isFetching ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                      <span className="text-[11px]">Consultando...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1.5 h-3 w-3" />
                      <span className="text-[11px]">Actualizar</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px]">
                Consultar API de Clarity (consume 1 call)
              </TooltipContent>
            </Tooltip>
          </div>

          {exhausted && (
            <p className="text-[10px] text-red-400/80 text-center">
              Limite diario alcanzado. Se reinicia a medianoche UTC.
            </p>
          )}

          {!exhausted && !fetchedAt && (
            <p className="text-[10px] text-muted-foreground/50 text-center">
              Se reinicia diariamente a medianoche UTC
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
