"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function MetaLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" />
    </svg>
  );
}

function ClarityLogoIcon({ className }: { className?: string }) {
  return (
    <img
      src="/clarity-logo.png"
      alt="Clarity"
      className={className}
      aria-hidden="true"
    />
  );
}

function ShopifyLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15.5 3.5s-.2-1.1-.7-1.3c-.5-.2-.8-.2-.8-.2l-1.2-.1-.8-.8s-.1-.1-.2-.1c-.1 0-.2 0-.2 0L11 2s-.5-.8-1.4-.8c-1 0-2 .6-2.5 1.5-.7 1.3-.5 2.6-.4 3l-1.5.5s-.5.1-.6.4c-.1.2-1.6 12.4-1.6 12.4l12.3 2.3L19 20s-2.1-15.5-2.1-15.7c-.1-.2-.2-.3-.4-.3l-1-.5zM12 3.3l-1 .3c0-.4 0-1-.2-1.5.5.1.9.7 1.2 1.2zm-1.7.5L8.5 4.4c.2-.7.5-1.3 1-1.7.2-.2.5-.3.7-.3.3.5.2 1.1.1 1.4zM10 1.8c.2 0 .4.1.6.2-.8.4-1.2 1-1.5 1.8l-1.2.4C8.2 3 8.7 1.8 10 1.8z" />
      <path d="M14.8 3.9s-.8-.2-.8-.2l-.3-.3c.5.1.8.3 1.1.5z" />
      <path d="M11.3 8.3c0 0-.5-.3-1.2-.3-.9 0-1 .5-1 .6 0 .7 1.8 1 1.8 2.6 0 1.3-.8 2.1-1.9 2.1-1.3 0-2-.8-2-.8l.4-1.2s.7.6 1.3.6c.4 0 .5-.3.5-.5 0-.9-1.5-1-1.5-2.5 0-1.3.9-2.5 2.7-2.5.7 0 1 .2 1 .2l-.1 1.7z" />
    </svg>
  );
}

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
        icon={<ShopifyLogoIcon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />}
        label="Shopify"
        status={shopifyStatus}
      />
      <IntegrationBadge
        icon={<MetaLogoIcon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />}
        label="Meta"
        status={metaStatus}
      />
      <IntegrationBadge
        icon={<ClarityLogoIcon className="h-4 w-4 shrink-0" />}
        label="Clarity"
        status={clarityStatus}
      />
    </div>
  );
}
