"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { KPIData } from "@/types/dashboard";

interface KPICardProps extends KPIData {
  isLoading?: boolean;
}

export function KPICard({ title, formattedValue, trend, icon: Icon, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {trend && TrendIcon && (
          <p
            className={cn(
              "text-xs flex items-center gap-1 mt-1",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend.value).toFixed(1)}% vs previous period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
