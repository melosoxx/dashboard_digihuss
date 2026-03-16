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
  compact?: boolean;
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
  compact,
  subtitle,
}: KPICardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasBreakdown = breakdown && breakdown.length > 0;

  if (isLoading) {
    return (
      <Card className="overflow-hidden py-0 gap-0">
        <CardContent className={cn("px-3 flex flex-col justify-center h-full", featured && !compact ? "py-3" : featured && compact ? "py-2" : "py-2.5 sm:py-2")}>
          <div className="flex items-center justify-between mb-0.5 sm:mb-1">
            <Skeleton className="h-3 w-16 sm:w-20" />
            <Skeleton className="rounded-md h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <Skeleton className={cn("w-24 sm:w-28", featured && !compact ? "h-7" : "h-5")} />
          <Skeleton className="h-3 w-16 sm:w-20 mt-0.5 sm:mt-1" />
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
        "overflow-hidden transition-all duration-200 py-0 gap-0",
        hasBreakdown && "cursor-pointer hover:shadow-md"
      )}
      onClick={() => hasBreakdown && setExpanded(!expanded)}
    >
      <CardContent className={cn("px-3 flex flex-col justify-center h-full", featured && !compact ? "py-3" : featured && compact ? "py-2" : "py-2.5 sm:py-2")}>
        {/* Top row: title + icon */}
        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
          <span className={cn("font-semibold uppercase tracking-wider text-muted-foreground", featured ? "text-xs" : "text-[9px] sm:text-[10px]")}>
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
                featured && !compact ? "h-8 w-8" : "h-5 w-5 sm:h-6 sm:w-6",
                iconClassName?.includes("emerald") ? "bg-emerald-500/15" :
                iconClassName?.includes("blue") ? "bg-blue-500/15" :
                iconClassName?.includes("red") ? "bg-red-500/15" :
                iconClassName?.includes("teal") ? "bg-teal-500/15" :
                iconClassName?.includes("orange") ? "bg-orange-500/15" :
                iconClassName?.includes("violet") ? "bg-violet-500/15" :
                iconClassName?.includes("amber") ? "bg-amber-500/15" :
                "bg-muted"
              )}>
                <Icon className={cn(featured && !compact ? "h-4.5 w-4.5" : "h-3 w-3 sm:h-3.5 sm:w-3.5", iconClassName || "text-muted-foreground")} />
              </div>
            )}
          </div>
        </div>

        {/* Value */}
        <div className={cn("font-bold tracking-tight", featured && !compact ? "text-[3rem] leading-none" : featured && compact ? "text-[2rem] leading-none" : "text-xl sm:text-xl", valueColorClass)}>
          {formattedValue}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className={cn("mt-0.5 sm:mt-1 font-medium", featured ? "text-xs text-muted-foreground" : "text-[10px] sm:text-[11px] text-sky-400/80")}>{subtitle}</p>
        )}

        {/* Trend */}
        {trend && (
          <div className={cn("inline-flex items-center gap-1 mt-1 sm:mt-2 px-1.5 py-0.5 rounded-md", trendBg)}>
            <TrendIcon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", trendColor)} />
            <span className={cn("text-[10px] sm:text-xs font-semibold", trendColor)}>
              {trend.direction !== "neutral" ? `${trend.direction === "up" ? "+" : ""}${trend.value.toFixed(1)}%` : "—"}
            </span>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground">vs ant.</span>
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
