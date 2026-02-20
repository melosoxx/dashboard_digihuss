"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, CircleDot, AlertTriangle } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface ScrollEngagementMapProps {
  scrollDepth: number;
  frustration: {
    deadClicks: number;
    rageClicks: number;
    quickbacks: number;
    errorClicks: number;
  };
  totalSessions: number;
  isLoading?: boolean;
}

const SECTION_LABELS: Array<{ label: string; position: number }> = [
  { label: "Hero", position: 5 },
  { label: "Beneficios", position: 25 },
  { label: "Producto", position: 45 },
  { label: "Testimonios", position: 65 },
  { label: "CTA / Footer", position: 87 },
];

function estimateEngagement(scrollPct: number, avgScrollDepth: number): number {
  if (avgScrollDepth <= 0) return scrollPct === 0 ? 1 : 0.05;

  const ratio = scrollPct / avgScrollDepth;
  if (ratio <= 0.5) return 1.0;
  if (ratio <= 1.0) return 1.0 - 0.3 * ((ratio - 0.5) / 0.5);
  const excess = ratio - 1.0;
  return Math.max(0.05, 0.7 * Math.exp(-2.5 * excess));
}

function engagementToColor(engagement: number): string {
  const hue = 30 + (1 - engagement) * 230;
  const chroma = 0.04 + engagement * 0.14;
  const lightness = 0.2 + engagement * 0.35;
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`;
}

const BANDS = Array.from({ length: 20 }, (_, i) => i * 5 + 2.5);

export function ScrollEngagementMap({
  scrollDepth,
  frustration,
  totalSessions,
  isLoading,
}: ScrollEngagementMapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[420px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalFrustration =
    frustration.deadClicks +
    frustration.rageClicks +
    frustration.quickbacks +
    frustration.errorClicks;

  const noData = scrollDepth <= 0 && totalSessions === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold">
          Mapa de Engagement por Scroll
        </CardTitle>
        <Badge variant="outline" className="text-[10px] border-border/50">
          Estimacion
        </Badge>
      </CardHeader>
      <CardContent>
        {noData ? (
          <div className="flex items-center justify-center h-[420px] text-sm text-muted-foreground">
            Sin datos suficientes
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Main visualization */}
            <div className="flex-1 relative">
              {/* Band container */}
              <div className="relative rounded-lg overflow-hidden border border-border/30">
                {BANDS.map((bandCenter) => {
                  const engagement = estimateEngagement(bandCenter, scrollDepth);
                  const color = engagementToColor(engagement);
                  return (
                    <div
                      key={bandCenter}
                      className="h-[21px] w-full transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  );
                })}

                {/* Scroll depth indicator line */}
                {scrollDepth > 0 && (
                  <div
                    className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                    style={{ top: `${Math.min(scrollDepth, 98)}%` }}
                  >
                    <div className="w-full border-t-2 border-dashed border-white/70" />
                    <div className="absolute right-2 -translate-y-1/2 bg-background/90 border border-border/60 rounded-md px-2 py-0.5">
                      <span className="text-[10px] font-medium text-foreground whitespace-nowrap">
                        {scrollDepth.toFixed(0)}% scroll promedio
                      </span>
                    </div>
                  </div>
                )}

                {/* Section labels */}
                {SECTION_LABELS.map((section) => (
                  <div
                    key={section.label}
                    className="absolute left-3 pointer-events-none"
                    style={{ top: `${section.position}%`, transform: "translateY(-50%)" }}
                  >
                    <span className="text-[10px] font-medium text-white/60 drop-shadow-sm">
                      {section.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: engagementToColor(1) }}
                  />
                  <span className="text-[10px] text-muted-foreground">Alto engagement</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: engagementToColor(0.1) }}
                  />
                  <span className="text-[10px] text-muted-foreground">Bajo engagement</span>
                </div>
              </div>
            </div>

            {/* Frustration signals sidebar */}
            <div className="w-28 space-y-3 pt-2">
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 text-center">
                <Flame className="h-3.5 w-3.5 mx-auto mb-1 text-red-400" />
                <p className="text-sm font-bold text-red-400">
                  {formatNumber(frustration.rageClicks)}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Clics de rabia
                </p>
              </div>
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-2.5 text-center">
                <CircleDot className="h-3.5 w-3.5 mx-auto mb-1 text-orange-400" />
                <p className="text-sm font-bold text-orange-400">
                  {formatNumber(frustration.deadClicks)}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Clics muertos
                </p>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-center">
                <AlertTriangle className="h-3.5 w-3.5 mx-auto mb-1 text-amber-400" />
                <p className="text-sm font-bold text-amber-400">
                  {formatNumber(totalFrustration)}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Total frustracion
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/50 mt-3 text-center">
          Estimacion basada en profundidad de scroll promedio ({scrollDepth.toFixed(1)}%)
        </p>
      </CardContent>
    </Card>
  );
}
