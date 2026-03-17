"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useCurrency } from "@/providers/currency-provider";
import { useEmailSendStatus } from "@/hooks/use-email-send-status";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { SendButton } from "@/components/comprobantes/send-button";
import type { OrderListItem } from "@/types/shopify";
import type { EmailSendStatusMap } from "@/types/email";

type SendStatus = EmailSendStatusMap[string];

interface RecentOrdersCardProps {
  orders: OrderListItem[];
  isLoading: boolean;
  aggregateMode?: boolean;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
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

export function RecentOrdersCard({
  orders,
  isLoading,
  aggregateMode,
  page = 0,
  pageSize = 15,
  onPageChange,
}: RecentOrdersCardProps) {
  const { activeProfileId } = useBusinessProfile();
  const { formatMoney } = useCurrency();
  const isMobile = useIsMobile();

  const isPaginated = !!onPageChange;
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const displayedOrders = isPaginated
    ? orders.slice(safePage * pageSize, (safePage + 1) * pageSize)
    : orders;

  const orderNames = useMemo(() => orders.map((o) => o.name), [orders]);
  const { data: sendStatusMap } = useEmailSendStatus(orderNames);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
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
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 py-3 px-4">
        <CardTitle className="text-sm font-semibold">
          Pedidos ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 px-4 pb-3">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No se encontraron pedidos en el periodo seleccionado
          </p>
        ) : (
          <>
            {isMobile ? (
              // Mobile: Card-based layout
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 px-1">
                {displayedOrders.map((order, idx) => (
                  <MobileOrderCard
                    key={`${order.name}-${idx}`}
                    order={order}
                    aggregateMode={!!aggregateMode}
                    sendStatus={sendStatusMap?.[order.name]}
                    activeProfileId={activeProfileId}
                    formatMoney={formatMoney}
                  />
                ))}
              </div>
            ) : (
              // Desktop: Table layout
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-card z-10">
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
                    {displayedOrders.map((order, idx) => (
                      <tr key={`${order.name}-${idx}`} className="border-b border-border/50 dark:border-border/10 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-150">
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
                          {formatMoney(order.total)}
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

            {/* Pagination controls */}
            {isPaginated && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3 flex-shrink-0 border-t border-border/30 pt-3">
                <button
                  onClick={() => onPageChange(Math.max(0, safePage - 1))}
                  disabled={safePage === 0}
                  className="flex items-center justify-center h-7 w-7 rounded-md border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => {
                  // Show first, last, current and neighbours; collapse others to "..."
                  const showDot = i !== 0 && i !== totalPages - 1 && Math.abs(i - safePage) > 1;
                  const showDotBefore = i === 1 && safePage > 2;
                  const showDotAfter = i === totalPages - 2 && safePage < totalPages - 3;
                  if (showDot && !showDotBefore && !showDotAfter) return null;
                  if (showDot && (showDotBefore || showDotAfter)) {
                    return (
                      <span key={i} className="text-xs text-muted-foreground/50 px-0.5">…</span>
                    );
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => onPageChange(i)}
                      className={`flex items-center justify-center h-7 min-w-[28px] px-1.5 rounded-md text-xs font-medium transition-colors border ${
                        i === safePage
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => onPageChange(Math.min(totalPages - 1, safePage + 1))}
                  disabled={safePage === totalPages - 1}
                  className="flex items-center justify-center h-7 w-7 rounded-md border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface MobileOrderCardProps {
  order: OrderListItem;
  aggregateMode: boolean;
  sendStatus: SendStatus | undefined;
  activeProfileId: string;
  formatMoney: (amount: number) => string;
}

function MobileOrderCard({
  order,
  aggregateMode,
  sendStatus,
  activeProfileId,
  formatMoney,
}: MobileOrderCardProps) {
  return (
    <div className="rounded-lg border border-border/20 bg-card overflow-hidden hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-150">
      {/* Profile Header (conditional) */}
      {aggregateMode && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/50 dark:border-border/10 bg-slate-50 dark:bg-white/[0.02]">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: order.profileColor ?? "#3b82f6" }}
          />
          <span className="text-[12px] text-muted-foreground truncate max-w-[200px]">
            {order.profileName ?? ""}
          </span>
        </div>
      )}

      {/* Order Info Section */}
      <div className="px-3 py-2.5 border-b border-border/50 dark:border-border/10 space-y-0.5">
        <div className="text-[13px] font-semibold">{order.name}</div>
        <div className="text-[12px] text-muted-foreground">
          {formatOrderDate(order.createdAt)}
        </div>
      </div>

      {/* Customer Section */}
      <div className="px-3 py-2 border-b border-border/50 dark:border-border/10">
        {order.customerEmail ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-[13px] text-muted-foreground truncate cursor-default">
                  {order.customerName}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {order.customerEmail}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="text-[13px] text-muted-foreground truncate" title={order.customerName}>
            {order.customerName}
          </div>
        )}
      </div>

      {/* Total Section */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 dark:border-border/10">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          Total
        </span>
        <span className="text-[14px] font-semibold">
          {formatMoney(order.total)}
        </span>
      </div>

      {/* Send Button Section */}
      <div className="flex justify-center px-3 py-2.5">
        <SendButton
          profileId={order.profileId ?? activeProfileId}
          orderName={order.name}
          customerEmail={order.customerEmail}
          customerName={order.customerName}
          sendStatus={sendStatus}
        />
      </div>
    </div>
  );
}
