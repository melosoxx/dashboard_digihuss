"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { KPIData } from "@/types/dashboard";

interface KPICardProps extends KPIData {
  isLoading?: boolean;
}

export function KPICard({ title, formattedValue, icon: Icon, iconClassName, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="px-2.5 py-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="px-2.5 py-1.5">
        {/* Top row: title + icon */}
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {Icon && (
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md",
              iconClassName?.includes("emerald") ? "bg-emerald-500/15" :
              iconClassName?.includes("blue") ? "bg-blue-500/15" :
              iconClassName?.includes("red") ? "bg-red-500/15" :
              iconClassName?.includes("teal") ? "bg-teal-500/15" :
              iconClassName?.includes("orange") ? "bg-orange-500/15" :
              iconClassName?.includes("violet") ? "bg-violet-500/15" :
              iconClassName?.includes("amber") ? "bg-amber-500/15" :
              "bg-muted"
            )}>
              <Icon className={cn("h-3.5 w-3.5", iconClassName || "text-muted-foreground")} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="text-lg font-bold tracking-tight">{formattedValue}</div>
      </CardContent>
    </Card>
  );
}
