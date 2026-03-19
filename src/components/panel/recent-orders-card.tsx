"use client";

import { useCallback, useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useCurrency } from "@/providers/currency-provider";
import { useEmailSendStatus } from "@/hooks/use-email-send-status";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { SendButton } from "@/components/comprobantes/send-button";
import type { OrderListItem } from "@/types/shopify";
import type { EmailSendStatusMap, ComposerData } from "@/types/email";

type SendStatus = EmailSendStatusMap[string];

interface RecentOrdersCardProps {
  orders: OrderListItem[];
  isLoading: boolean;
  aggregateMode?: boolean;
  onCompose?: (data: ComposerData) => void;
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
  onCompose,
}: RecentOrdersCardProps) {
  const { activeProfileId } = useBusinessProfile();
  const { formatMoney } = useCurrency();
  const isMobile = useIsMobile();

  const orderNames = useMemo(() => orders.map((o) => o.name), [orders]);
  const { data: sendStatusMap } = useEmailSendStatus(orderNames);

  // Lookup status using composite key in aggregate mode
  const getStatus = useCallback(
    (order: OrderListItem): SendStatus | undefined => {
      if (!sendStatusMap) return undefined;
      if (aggregateMode && order.profileId) {
        return sendStatusMap[`${order.profileId}:${order.name}`];
      }
      return sendStatusMap[order.name];
    },
    [sendStatusMap, aggregateMode]
  );

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="space-y-3 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardContent className="flex-1 flex flex-col min-h-0 px-4 py-3">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No se encontraron pedidos en el periodo seleccionado
          </p>
        ) : (
          <>
            {isMobile ? (
              // Mobile: Card-based layout
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2 px-1">
                {orders.map((order, idx) => (
                  <MobileOrderCard
                    key={`${order.name}-${idx}`}
                    order={order}
                    aggregateMode={!!aggregateMode}
                    sendStatus={getStatus(order)}
                    activeProfileId={activeProfileId}
                    formatMoney={formatMoney}
                    onCompose={onCompose}
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
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Contacto</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Total</th>
                      <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center pb-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, idx) => (
                      <tr key={`${order.name}-${idx}`} className={cn(
                        "border-b border-border/50 dark:border-border/10 last:border-0 transition-colors duration-150",
                        getStatus(order)?.status === "sent"
                          ? "bg-green-50/40 dark:bg-green-950/10 hover:bg-green-50/70 dark:hover:bg-green-950/20"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                      )}>
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
                        <td className="py-3 pr-4">
                          {(order.customerEmail || order.customerPhone) ? (
                            <span className="flex items-center gap-1.5 max-w-[200px]">
                              <span className="text-[13px] text-muted-foreground truncate" title={order.customerEmail || order.customerPhone}>
                                {order.customerEmail || order.customerPhone}
                              </span>
                              <CopyButton text={order.customerEmail || order.customerPhone || ""} />
                            </span>
                          ) : (
                            <span className="text-[13px] text-muted-foreground">-</span>
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
                            sendStatus={getStatus(order)}
                            onCompose={onCompose}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
  onCompose?: (data: ComposerData) => void;
}

function MobileOrderCard({
  order,
  aggregateMode,
  sendStatus,
  activeProfileId,
  formatMoney,
  onCompose,
}: MobileOrderCardProps) {
  return (
    <div className={cn(
      "rounded-lg border overflow-hidden transition-colors duration-150",
      sendStatus?.status === "sent"
        ? "border-green-200/50 dark:border-green-800/20 bg-green-50/30 dark:bg-green-950/10"
        : "border-border/20 bg-card hover:bg-slate-50 dark:hover:bg-white/[0.03]"
    )}>
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
      <div className="px-3 py-2 border-b border-border/50 dark:border-border/10 space-y-0.5">
        <div className="text-[13px] text-muted-foreground truncate" title={order.customerName}>
          {order.customerName}
        </div>
        {(order.customerEmail || order.customerPhone) && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground/70 truncate">
              {order.customerEmail || order.customerPhone}
            </span>
            <CopyButton text={order.customerEmail || order.customerPhone || ""} />
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
          onCompose={onCompose}
        />
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 p-0.5 rounded hover:bg-white/10 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      title="Copiar"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}
