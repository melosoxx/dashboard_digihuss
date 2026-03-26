"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportResultProps {
  inserted: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
  onReset: () => void;
}

export function ImportResult({
  inserted,
  failed,
  errors,
  onReset,
}: ImportResultProps) {
  return (
    <div className="space-y-6 text-center">
      {/* Icon */}
      <div className="flex justify-center">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            failed === 0
              ? "bg-green-100 dark:bg-green-950/30"
              : "bg-amber-100 dark:bg-amber-950/30"
          }`}
        >
          {failed === 0 ? (
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          ) : (
            <FileSpreadsheet className="h-8 w-8 text-amber-600" />
          )}
        </div>
      </div>

      {/* Summary text */}
      <div>
        <h3 className="text-lg font-semibold">Importacion completada</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {inserted} gasto{inserted !== 1 ? "s" : ""} importado
          {inserted !== 1 ? "s" : ""} exitosamente
          {failed > 0 && (
            <>
              , {failed} con errores
            </>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-2xl font-bold">{inserted}</span>
          <span className="text-sm text-muted-foreground">importados</span>
        </div>
        {failed > 0 && (
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-bold">{failed}</span>
            <span className="text-sm text-muted-foreground">fallidos</span>
          </div>
        )}
      </div>

      {/* Errors detail */}
      {errors.length > 0 && (
        <div className="text-left rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3 max-h-[200px] overflow-auto">
          <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
            Errores:
          </p>
          <ul className="space-y-1">
            {errors.map((e, i) => (
              <li
                key={i}
                className="text-xs text-red-600 dark:text-red-400"
              >
                Fila {e.index + 1}: {e.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onReset}>
          Importar otro archivo
        </Button>
        <Button asChild>
          <Link href="/finanzas">Ir a P&L</Link>
        </Button>
      </div>
    </div>
  );
}
