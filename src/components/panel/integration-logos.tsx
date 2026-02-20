"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Official Shopify bag logo (source: Simple Icons)
function ShopifyLogo() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="#95BF47">
      <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z" />
    </svg>
  );
}

// Official Meta infinity logo (source: Simple Icons)
function MetaLogo() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="#0081FB">
      <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" />
    </svg>
  );
}

// Official Microsoft Clarity logo (source: clarity.microsoft.com)
function ClarityLogo() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 18" fill="none">
      <path d="M10 -1.009L14.483 6.675 3.725 9.749 10-1.009z" fill="#41A5EE" />
      <path d="M10 -1.009L14.483 6.675 3.725 9.749 10-1.009z" fill="url(#cl_a)" fillOpacity="0.2" />
      <path d="M3.725 9.749L20.758 17.433 14.483 6.675 3.725 9.749z" fill="url(#cl_b)" />
      <path d="M20.758 17.433H-0.758L3.725 9.749 20.758 17.433z" fill="url(#cl_c)" />
      <defs>
        <linearGradient id="cl_a" x1="11.79" y1="1.63" x2="11.79" y2="12.16" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cl_b" x1="10" y1="8.98" x2="19.22" y2="15.9" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2B7CD3" />
          <stop offset="1" stopColor="#185ABD" />
        </linearGradient>
        <linearGradient id="cl_c" x1="2.65" y1="8.21" x2="20.8" y2="10.15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#185ABD" />
          <stop offset="1" stopColor="#103F91" />
        </linearGradient>
      </defs>
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
      <IntegrationBadge icon={<ShopifyLogo />} label="Shopify" status={shopifyStatus} />
      <IntegrationBadge icon={<MetaLogo />} label="Meta" status={metaStatus} />
      <IntegrationBadge icon={<ClarityLogo />} label="Clarity" status={clarityStatus} />
    </div>
  );
}
