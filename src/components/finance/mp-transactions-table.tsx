"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { MpTransaction } from "@/types/finance";

interface MpTransactionsTableProps {
  transactions: MpTransaction[];
  isLoading: boolean;
  aggregateMode?: boolean;
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
}: MpTransactionsTableProps) {
  if (isLoading) {
    return (
      <Card>
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
      <Card>
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

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
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
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-border/20 last:border-0 hover:bg-white/[0.03] transition-colors"
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
                    {formatCurrency(tx.grossAmount)}
                  </td>
                  <td className="text-[13px] text-right px-4 py-3 text-amber-500 whitespace-nowrap">
                    -{formatCurrency(tx.fees)}
                  </td>
                  <td className="text-[13px] text-right px-4 py-3 font-medium whitespace-nowrap">
                    {formatCurrency(tx.netAmount)}
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
                  {formatCurrency(totals.gross)}
                </td>
                <td className="text-[13px] text-right px-4 py-2.5 text-amber-500 font-bold whitespace-nowrap">
                  -{formatCurrency(totals.fees)}
                </td>
                <td className="text-[13px] text-right px-4 py-2.5 font-bold whitespace-nowrap">
                  {formatCurrency(totals.net)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
