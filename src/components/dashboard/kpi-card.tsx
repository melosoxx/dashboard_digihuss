"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
}

export function KPICard({
  title,
  formattedValue,
  icon: Icon,
  iconClassName,
  isLoading,
  breakdown,
  breakdownLoading,
}: KPICardProps) {
  const [expanded, setExpanded] = useState(false);

  const hasBreakdown = breakdown && breakdown.length > 0;

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
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        hasBreakdown && "cursor-pointer hover:shadow-md"
      )}
      onClick={() => hasBreakdown && setExpanded(!expanded)}
    >
      <CardContent className="px-2.5 py-1.5">
        {/* Top row: title + icon */}
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
        </div>

        {/* Value */}
        <div className="text-lg font-bold tracking-tight">{formattedValue}</div>

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
