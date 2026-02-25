"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { OrderListItem } from "@/types/shopify";

interface RecentOrdersCardProps {
  orders: OrderListItem[];
  isLoading: boolean;
  aggregateMode?: boolean;
}

function formatOrderDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentOrdersCard({ orders, isLoading, aggregateMode }: RecentOrdersCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">
          Pedidos ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No se encontraron pedidos en el periodo seleccionado
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  {aggregateMode && (
                    <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Perfil</th>
                  )}
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Pedido</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Fecha</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Cliente</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr key={`${order.name}-${idx}`} className="border-b border-border/20 last:border-0">
                    {aggregateMode && (
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: order.profileColor ?? "#3b82f6" }}
                          />
                          <span className="text-[12px] text-muted-foreground truncate max-w-[100px]">
                            {order.profileName ?? ""}
                          </span>
                        </span>
                      </td>
                    )}
                    <td className="py-3 pr-4">
                      <span className="text-[13px] font-medium">{order.name}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-[13px] text-muted-foreground">
                        {formatOrderDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-[13px] text-muted-foreground truncate block max-w-[200px]" title={order.customerName}>
                        {order.customerName}
                      </span>
                    </td>
                    <td className="py-3 text-right text-[13px] font-medium">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
