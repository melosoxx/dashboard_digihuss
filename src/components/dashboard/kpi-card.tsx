"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { KPIData } from "@/types/dashboard";

interface KPICardProps extends KPIData {
  isLoading?: boolean;
}

export function KPICard({ title, formattedValue, trend, icon: Icon, iconClassName, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-28 mb-1" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = trend
    ? trend.direction === "up"
      ? ArrowUp
      : trend.direction === "down"
      ? ArrowDown
      : Minus
    : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Top row: title + icon */}
        <div className="flex items-start justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {Icon && (
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              iconClassName?.includes("emerald") ? "bg-emerald-500/15" :
              iconClassName?.includes("blue") ? "bg-blue-500/15" :
              iconClassName?.includes("red") ? "bg-red-500/15" :
              iconClassName?.includes("teal") ? "bg-teal-500/15" :
              iconClassName?.includes("orange") ? "bg-orange-500/15" :
              iconClassName?.includes("violet") ? "bg-violet-500/15" :
              iconClassName?.includes("amber") ? "bg-amber-500/15" :
              "bg-muted"
            )}>
              <Icon className={cn("h-4 w-4", iconClassName || "text-muted-foreground")} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="text-2xl font-bold tracking-tight">{formattedValue}</div>

        {/* Trend */}
        {trend && TrendIcon && (
          <p
            className={cn(
              "text-xs flex items-center gap-1 mt-1.5",
              trend.isPositive ? "text-emerald-400" : "text-red-400"
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend.value).toFixed(1)}%
            <span className="text-muted-foreground ml-0.5">vs período anterior</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
