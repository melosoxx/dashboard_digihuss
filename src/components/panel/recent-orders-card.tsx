"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { OrderListItem } from "@/types/shopify";

interface RecentOrdersCardProps {
  orders: OrderListItem[];
  isLoading: boolean;
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

export function RecentOrdersCard({ orders, isLoading }: RecentOrdersCardProps) {
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
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Pedido</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Fecha</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Cliente</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.name} className="border-b border-border/20 last:border-0">
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
                      {formatCurrency(order.total)}
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
