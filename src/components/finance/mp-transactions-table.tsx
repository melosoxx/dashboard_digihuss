"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/providers/currency-provider";
import type { MpTransaction } from "@/types/finance";

interface MpTransactionsTableProps {
  transactions: MpTransaction[];
  isLoading: boolean;
  aggregateMode?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

function formatTxDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MpTransactionsTable({
  transactions,
  isLoading,
  aggregateMode,
  page = 0,
  pageSize = 15,
  onPageChange,
}: MpTransactionsTableProps) {
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            No se encontraron transacciones de MercadoPago en este periodo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totals = transactions.reduce(
    (acc, tx) => ({
      gross: acc.gross + tx.grossAmount,
      fees: acc.fees + tx.fees,
      net: acc.net + tx.netAmount,
    }),
    { gross: 0, fees: 0, net: 0 }
  );

  const totalPages = Math.ceil(transactions.length / pageSize);
  const usePagination = onPageChange && transactions.length > pageSize;
  const displayed = usePagination
    ? transactions.slice(page * pageSize, (page + 1) * pageSize)
    : transactions;

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
        <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border/30">
                {aggregateMode && (
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5">
                    Perfil
                  </th>
                )}
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5">
                  Fecha
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5">
                  Descripcion
                </th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5">
                  Metodo
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5">
                  Bruto
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5">
                  Comisiones
                </th>
                <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5">
                  Neto
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-border/20 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  {aggregateMode && (
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tx.profileColor ?? "#3b82f6" }}
                        />
                        <span className="text-[12px] text-muted-foreground truncate max-w-[100px]">
                          {tx.profileName ?? ""}
                        </span>
                      </span>
                    </td>
                  )}
                  <td className="text-[13px] text-muted-foreground px-4 py-3 whitespace-nowrap">
                    {formatTxDate(tx.date)}
                  </td>
                  <td className="text-[13px] px-4 py-3 max-w-[200px] truncate">
                    {tx.description ?? "—"}
                  </td>
                  <td className="text-[13px] px-4 py-3 whitespace-nowrap">
                    <span className="text-muted-foreground">
                      {tx.paymentType}
                    </span>
                    {tx.installments > 1 && (
                      <Badge
                        variant="outline"
                        className="ml-1.5 text-[10px] px-1.5 py-0"
                      >
                        {tx.installments} cuotas
                      </Badge>
                    )}
                  </td>
                  <td className="text-[13px] text-right px-4 py-3 text-emerald-500 font-medium whitespace-nowrap">
                    {formatMoney(tx.grossAmount)}
                  </td>
                  <td className="text-[13px] text-right px-4 py-3 text-amber-500 whitespace-nowrap">
                    -{formatMoney(tx.fees)}
                  </td>
                  <td className="text-[13px] text-right px-4 py-3 font-medium whitespace-nowrap">
                    {formatMoney(tx.netAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border/50 bg-muted/30">
                <td
                  colSpan={aggregateMode ? 4 : 3}
                  className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2.5"
                >
                  Total ({transactions.length} transacciones)
                </td>
                <td className="text-[13px] text-right px-4 py-2.5 text-emerald-500 font-bold whitespace-nowrap">
                  {formatMoney(totals.gross)}
                </td>
                <td className="text-[13px] text-right px-4 py-2.5 text-amber-500 font-bold whitespace-nowrap">
                  -{formatMoney(totals.fees)}
                </td>
                <td className="text-[13px] text-right px-4 py-2.5 font-bold whitespace-nowrap">
                  {formatMoney(totals.net)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        {usePagination && (
          <div className="flex items-center justify-between border-t border-border/30 px-4 py-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">
              Página {page + 1} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === 0}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page >= totalPages - 1}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
