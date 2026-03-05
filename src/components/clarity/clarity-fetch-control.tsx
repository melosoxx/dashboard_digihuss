"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, Info, Database, AlertTriangle } from "lucide-react";

interface ClarityFetchControlProps {
  isFetching: boolean;
  isManualFetching: boolean;
  hasData: boolean;
  lastFetchedAt: string | null;
  daysAvailable: number;
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

export function ClarityFetchControl({
  isFetching,
  isManualFetching,
  hasData,
  lastFetchedAt,
  daysAvailable,
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
                  Los datos de Clarity se recolectan automaticamente todos los dias
                  a las 23:59. Podes usar el boton para actualizar los datos de hoy
                  manualmente si es necesario.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Rate limit warning */}
          {rateLimited && (
            <div className="flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <p className="text-[11px] text-red-400">
                Limite diario alcanzado. Se reinicia a medianoche UTC.
              </p>
            </div>
          )}

          {/* Data availability indicator */}
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
            <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="text-[11px]">
              {daysAvailable > 0 ? (
                <span className="text-foreground/80">
                  <span className="font-medium">{daysAvailable}</span>{" "}
                  {daysAvailable === 1 ? "dia" : "dias"} de datos en este rango
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Sin datos para este rango
                </span>
              )}
            </div>
          </div>

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
