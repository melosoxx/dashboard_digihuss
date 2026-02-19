import {
  LayoutDashboard,
  Megaphone,
  TrendingUp,
  MousePointerClick,
} from "lucide-react";

export const NAV_ITEMS: ReadonlyArray<{
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}> = [
  { label: "Sales Overview", href: "/", icon: LayoutDashboard },
  { label: "Ad Performance", href: "/ads", icon: Megaphone },
  { label: "ROI Analysis", href: "/roi", icon: TrendingUp },
  { label: "UX Insights", href: "/ux-insights", icon: MousePointerClick },
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
