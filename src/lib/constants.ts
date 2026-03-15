import {
  LayoutGrid,
  Wallet,
  Settings,
  Wrench,
} from "lucide-react";

export const NAV_ITEMS: ReadonlyArray<{
  label: string;
  href: string;
  icon: typeof LayoutGrid;
  badge?: string;
}> = [
  { label: "Panel General", href: "/panel", icon: LayoutGrid },
  { label: "Finanzas", href: "/finanzas", icon: Wallet },
  { label: "Configuracion", href: "/configuracion", icon: Settings },
  { label: "Admin Tools", href: "/admin-tools", icon: Wrench },
];

export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
export const QUERY_REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const CHART_COLORS = {
  primary: "var(--chart-1)",
  secondary: "var(--chart-2)",
  tertiary: "var(--chart-3)",
  quaternary: "var(--chart-4)",
  quinary: "var(--chart-5)",
} as const;
