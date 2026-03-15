"use client";

import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";
import type { MercadoPagoSummary } from "@/types/finance";

interface MpFeesCardProps {
  data: MercadoPagoSummary | null | undefined;
  isLoading: boolean;
  serviceStatus?: "ok" | "error";
}

export function MpFeesCard({ data, isLoading, serviceStatus }: MpFeesCardProps) {
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-52" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[140px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.paymentCount === 0) {
    const message =
      serviceStatus === "error"
        ? "Error al consultar MercadoPago. Verifica tus credenciales en Configuracion."
        : !data
        ? "MercadoPago no esta configurado. Agrega tus credenciales en Configuracion."
        : "No se encontraron transacciones aprobadas en este periodo.";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-500" />
            Comisiones MercadoPago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-amber-500" />
          Comisiones MercadoPago
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Total comisiones
            </p>
            <p className="text-lg font-bold text-amber-500">
              {formatMoney(data.totalFees)}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Comision promedio
            </p>
            <p className="text-lg font-bold">{data.avgFeePercent.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Transacciones
            </p>
            <p className="text-lg font-bold">{data.paymentCount}</p>
          </div>
        </div>

        {data.byPaymentType.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Por metodo de pago
            </p>
            <div className="space-y-2">
              {data.byPaymentType.map((pt) => {
                const pctOfTotal =
                  data.grossAmount > 0
                    ? (pt.gross / data.grossAmount) * 100
                    : 0;
                const feeRate =
                  pt.gross > 0 ? (pt.fees / pt.gross) * 100 : 0;

                return (
                  <div
                    key={pt.type}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-muted-foreground truncate">
                        {pt.label}
                      </span>
                      <span className="text-muted-foreground/60 shrink-0">
                        ({pctOfTotal.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-amber-500 font-medium">
                        {formatMoney(pt.fees)}
                      </span>
                      <span className="text-muted-foreground w-12 text-right">
                        {feeRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}