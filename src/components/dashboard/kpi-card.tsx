"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPIData } from "@/types/dashboard";

export interface ProfileBreakdownItem {
  profileName: string;
  profileColor: string;
  formattedValue: string;
  rawValue: number;
}

interface KPICardProps extends KPIData {
  isLoading?: boolean;
  breakdown?: ProfileBreakdownItem[];
  breakdownLoading?: boolean;
  featured?: boolean;
  subtitle?: string;
}

export function KPICard({
  title,
  formattedValue,
  icon: Icon,
  iconClassName,
  isLoading,
  breakdown,
  breakdownLoading,
  trend,
  featured,
  subtitle,
}: KPICardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasBreakdown = breakdown && breakdown.length > 0;

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className={cn("px-3 flex flex-col justify-center h-full", featured ? "py-4" : "py-2.5")}>
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className={cn("rounded-md", featured ? "h-7 w-7" : "h-6 w-6")} />
          </div>
          <Skeleton className={cn("w-28", featured ? "h-9" : "h-6")} />
          <Skeleton className="h-3 w-20 mt-1" />
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const trendColor = trend?.isPositive ? "text-emerald-400" : "text-red-400";
  const trendBg = trend?.isPositive ? "bg-emerald-500/10" : "bg-red-500/10";

  const valueColorClass = featured
    ? (iconClassName?.includes("emerald") || iconClassName?.includes("teal") ? "text-emerald-400" : "text-foreground")
    : "";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        hasBreakdown && "cursor-pointer hover:shadow-md"
      )}
      onClick={() => hasBreakdown && setExpanded(!expanded)}
    >
      <CardContent className={cn("px-3 flex flex-col justify-center h-full", featured ? "py-4" : "py-2.5")}>
        {/* Top row: title + icon */}
        <div className="flex items-center justify-between mb-1">
          <span className={cn("font-semibold uppercase tracking-wider text-muted-foreground", featured ? "text-[11px]" : "text-[10px]")}>
            {title}
          </span>
          <div className="flex items-center gap-1">
            {hasBreakdown && (
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform duration-200",
                  expanded && "rotate-180"
                )}
              />
            )}
            {Icon && (
              <div className={cn(
                "flex items-center justify-center rounded-md",
                featured ? "h-7 w-7" : "h-6 w-6",
                iconClassName?.includes("emerald") ? "bg-emerald-500/15" :
                iconClassName?.includes("blue") ? "bg-blue-500/15" :
                iconClassName?.includes("red") ? "bg-red-500/15" :
                iconClassName?.includes("teal") ? "bg-teal-500/15" :
                iconClassName?.includes("orange") ? "bg-orange-500/15" :
                iconClassName?.includes("violet") ? "bg-violet-500/15" :
                iconClassName?.includes("amber") ? "bg-amber-500/15" :
                "bg-muted"
              )}>
                <Icon className={cn(featured ? "h-4 w-4" : "h-3.5 w-3.5", iconClassName || "text-muted-foreground")} />
              </div>
            )}
          </div>
        </div>

        {/* Value */}
        <div className={cn("font-bold tracking-tight", featured ? "text-[2.25rem] leading-none" : "text-xl", valueColorClass)}>
          {formattedValue}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className={cn("text-muted-foreground mt-1", featured ? "text-xs" : "text-[11px]")}>{subtitle}</p>
        )}

        {/* Trend */}
        {trend && (
          <div className={cn("inline-flex items-center gap-1 mt-2 px-1.5 py-0.5 rounded-md", trendBg)}>
            <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
            <span className={cn("text-xs font-semibold", trendColor)}>
              {trend.direction !== "neutral" ? `${trend.direction === "up" ? "+" : ""}${trend.value.toFixed(1)}%` : "—"}
            </span>
            <span className="text-[11px] text-muted-foreground">vs ant.</span>
          </div>
        )}

        {/* Collapsible breakdown */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-200 ease-in-out",
            expanded ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
          )}
        >
          <div className="border-t border-border/50 pt-2 space-y-1.5">
            {breakdownLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))
            ) : (
              breakdown?.map((item) => (
                <div
                  key={item.profileName}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.profileColor }}
                    />
                    <span className="truncate">{item.profileName}</span>
                  </div>
                  <span className="font-medium ml-2 whitespace-nowrap">
                    {item.formattedValue}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
