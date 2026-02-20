import {
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  TrendingUp,
  MousePointerClick,
  Settings,
} from "lucide-react";

export const NAV_ITEMS: ReadonlyArray<{
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}> = [
  { label: "Panel General", href: "/panel", icon: LayoutGrid },
  { label: "Resumen de Ventas", href: "/", icon: LayoutDashboard },
  { label: "Rendimiento Ads", href: "/ads", icon: Megaphone },
  { label: "Análisis ROI", href: "/roi", icon: TrendingUp },
  { label: "Insights UX", href: "/ux-insights", icon: MousePointerClick },
  { label: "Configuracion", href: "/configuracion", icon: Settings },
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
