"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap } from "lucide-react";

interface ClarityFetchControlProps {
  remaining: number;
  max: number;
  exhausted: boolean;
  isFetching: boolean;
  hasData: boolean;
  onFetch: () => void;
}

export function ClarityFetchControl({
  remaining,
  max,
  exhausted,
  isFetching,
  hasData,
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

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
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

        {/* Fetch button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={exhausted || isFetching}
          onClick={onFetch}
        >
          {isFetching ? (
            <>
              <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
              Cargando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-3 w-3" />
              {hasData ? "Actualizar datos" : "Cargar datos"}
            </>
          )}
        </Button>

        {exhausted && (
          <p className="text-[10px] text-red-400/80 text-center">
            Limite diario alcanzado. Se reinicia a medianoche UTC.
          </p>
        )}

        {!exhausted && (
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Se reinicia diariamente a medianoche UTC
          </p>
        )}
      </CardContent>
    </Card>
  );
}
