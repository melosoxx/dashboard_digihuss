import type { LucideIcon } from "lucide-react";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface KPIData {
  title: string;
  value: number;
  formattedValue: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    isPositive: boolean;
  };
  icon?: LucideIcon;
  iconClassName?: string;
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
