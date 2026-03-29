"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, ExternalLink } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  past_due: "Pago pendiente",
  cancelled: "Cancelada",
  paused: "Pausada",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  past_due: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  paused: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export function SubscriptionSection() {
  const { isSuperadmin } = useAuth();
  const { data, isLoading } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  // Superadmin doesn't need a subscription
  if (isSuperadmin) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Suscripcion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  const sub = data?.subscription;

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/payments/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.open(url, "_blank");
    } catch {
      // silently fail
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Suscripcion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sub ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              <Badge
                variant="outline"
                className={STATUS_COLORS[sub.status] ?? ""}
              >
                {STATUS_LABELS[sub.status] ?? sub.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="text-sm font-medium">
                ${sub.amount} {sub.currency}/mes
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Proveedor</span>
              <span className="text-sm capitalize">{sub.provider}</span>
            </div>

            {sub.current_period_end && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Proximo cobro
                </span>
                <span className="text-sm">
                  {new Date(sub.current_period_end).toLocaleDateString()}
                </span>
              </div>
            )}

            {data?.hasStripeCustomer && sub.provider === "stripe" && (
              <Button
                variant="outline"
                size="sm"
                onClick={openPortal}
                disabled={portalLoading}
                className="w-full mt-2"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                {portalLoading ? "Abriendo..." : "Gestionar Suscripcion"}
              </Button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No tenes una suscripcion activa.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
