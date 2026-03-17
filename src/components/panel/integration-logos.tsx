"use client";

import { ShoppingBag, Megaphone, MousePointerClick } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type BadgeStatus = "connected" | "loading" | "idle" | "error";

interface IntegrationBadgeProps {
  icon: React.ReactNode;
  label: string;
  status: BadgeStatus;
}

const statusStyles: Record<BadgeStatus, string> = {
  loading: "border-border/50 text-muted-foreground bg-muted/30 animate-pulse",
  connected: "border-border bg-card text-foreground",
  idle: "border-border/50 bg-muted/20 text-muted-foreground",
  error: "border-destructive/30 bg-destructive/5 text-destructive",
};

const dotStyles: Record<BadgeStatus, string> = {
  loading: "bg-muted-foreground",
  connected: "bg-emerald-500",
  idle: "bg-amber-400",
  error: "bg-destructive",
};

const statusLabels: Record<BadgeStatus, string> = {
  loading: "Cargando...",
  connected: "Conectado",
  idle: "No cargado",
  error: "Error de conexion",
};

function IntegrationBadge({ icon, label, status }: IntegrationBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            statusStyles[status]
          )}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
          <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[status])} />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}: {statusLabels[status]}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface IntegrationLogosProps {
  shopifyStatus: BadgeStatus;
  metaStatus: BadgeStatus;
  clarityStatus: BadgeStatus;
}

export function IntegrationLogos({
  shopifyStatus,
  metaStatus,
  clarityStatus,
}: IntegrationLogosProps) {
  return (
    <div className="flex items-center gap-1.5">
      <IntegrationBadge
        icon={<ShoppingBag className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
        label="Shopify"
        status={shopifyStatus}
      />
      <IntegrationBadge
        icon={<Megaphone className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />}
        label="Meta"
        status={metaStatus}
      />
      <IntegrationBadge
        icon={<MousePointerClick className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />}
        label="Clarity"
        status={clarityStatus}
      />
    </div>
  );
}
