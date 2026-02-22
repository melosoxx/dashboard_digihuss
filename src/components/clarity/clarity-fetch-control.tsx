"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Info, Database, CalendarDays, History, AlertTriangle } from "lucide-react";
import type { ClarityVersion } from "@/types/clarity";

interface ClarityFetchControlProps {
  isFetching: boolean;
  isLoadingCache: boolean;
  hasData: boolean;
  fetchedAt: string | null;
  startDate: string;
  endDate: string;
  rateLimited: boolean;
  onLoadCache: () => void;
  onFetch: () => void;
  versions: ClarityVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
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

const PERIOD_LABELS: Record<number, string> = {
  1: "Hoy",
  2: "2 dias",
  3: "3 dias",
};

export function ClarityFetchControl({
  isFetching,
  isLoadingCache,
  hasData,
  fetchedAt,
  startDate,
  endDate,
  rateLimited,
  onLoadCache,
  onFetch,
  versions,
  selectedVersionId,
  onSelectVersion,
}: ClarityFetchControlProps) {
  const isWorking = isFetching || isLoadingCache;

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
                <p className="font-medium mb-1">Como funciona Clarity</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  Microsoft Clarity tiene un limite de 10 consultas diarias a su API.
                  Cada consulta se guarda como una version que podes revisar despues.
                  El contador se reinicia a medianoche UTC.
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

          {/* ── SECTION 1: Fetch new data ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3 text-blue-400 shrink-0" />
              <span className="text-[11px] font-medium text-foreground/80">
                {startDate === endDate
                  ? new Date(startDate + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })
                  : `${new Date(startDate + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} - ${new Date(endDate + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}`}
              </span>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hasData ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  disabled={isWorking || rateLimited}
                  onClick={onFetch}
                >
                  {isFetching ? (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Actualizar datos
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px]">
                Consultar API de Clarity con el periodo seleccionado (consume 1 call)
              </TooltipContent>
            </Tooltip>

            {fetchedAt && (
              <p className="text-[10px] text-muted-foreground text-center">
                Ultima consulta: {formatLastFetch(fetchedAt)}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* ── SECTION 2: Saved versions ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <History className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-medium text-foreground/80">
                  Versiones guardadas
                </span>
              </div>
              {versions.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {versions.length}
                </span>
              )}
            </div>

            {versions.length > 0 ? (
              <>
                <Select
                  value={selectedVersionId ?? undefined}
                  onValueChange={onSelectVersion}
                >
                  <SelectTrigger className="h-8 text-[11px] w-full">
                    <SelectValue placeholder="Seleccionar version..." />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v, index) => (
                      <SelectItem key={v.id} value={v.id} className="text-[11px]">
                        {formatLastFetch(v.fetchedAt)} — {PERIOD_LABELS[v.numOfDays] ?? `${v.numOfDays}d`}
                        {index === 0 && " (mas reciente)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isWorking || !selectedVersionId}
                      onClick={onLoadCache}
                    >
                      {isLoadingCache ? (
                        <>
                          <Database className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        <>
                          <Database className="mr-1.5 h-3.5 w-3.5" />
                          Cargar version
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-[11px]">
                    Cargar la version seleccionada (no consume calls)
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground/60 text-center py-1">
                Aun no hay versiones. Usa &quot;Actualizar datos&quot; para crear la primera.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
