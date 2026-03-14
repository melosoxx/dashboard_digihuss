"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useEmailSendStatus } from "@/hooks/use-email-send-status";
import { SendButton } from "@/components/comprobantes/send-button";
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
  const { activeProfileId } = useBusinessProfile();

  const orderNames = useMemo(() => orders.map((o) => o.name), [orders]);
  const { data: sendStatusMap } = useEmailSendStatus(orderNames);

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
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center pb-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, idx) => (
                  <tr key={`${order.name}-${idx}`} className="border-b border-border/10 last:border-0 hover:bg-white/[0.03] transition-colors duration-150">
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
                      {order.customerEmail ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[13px] text-muted-foreground truncate block max-w-[200px] cursor-default">
                                {order.customerName}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {order.customerEmail}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-[13px] text-muted-foreground truncate block max-w-[200px]" title={order.customerName}>
                          {order.customerName}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right text-[13px] font-medium">
                      {formatCurrency(order.total, order.currency)}
                    </td>
                    <td className="py-3 text-center">
                      <SendButton
                        profileId={order.profileId ?? activeProfileId}
                        orderName={order.name}
                        customerEmail={order.customerEmail}
                        customerName={order.customerName}
                        sendStatus={sendStatusMap?.[order.name]}
                      />
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
