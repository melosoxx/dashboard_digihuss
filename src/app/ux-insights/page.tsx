"use client";

import {
  MousePointerClick,
  Eye,
  Flame,
  CircleDot,
  BarChart3,
  Users,
  Clock,
  Monitor,
  Globe,
  ArrowDownUp,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KPICard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { useClarity } from "@/hooks/use-clarity";
import { formatNumber } from "@/lib/utils";

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function shortenUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "/" : parsed.pathname;
    return path.length > 40 ? path.slice(0, 40) + "…" : path;
  } catch {
    return url.length > 40 ? url.slice(0, 40) + "…" : url;
  }
}

function BreakdownCard({
  title,
  icon: Icon,
  items,
  isLoading,
}: {
  title: string;
  icon: typeof Monitor;
  items: Array<{ name: string; sessions: number }>;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const total = items.reduce((sum, i) => sum + i.sessions, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const pct = total > 0 ? (item.sessions / total) * 100 : 0;
          return (
            <div key={item.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="truncate mr-2">{item.name}</span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {formatNumber(item.sessions)} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No data</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function UXInsightsPage() {
  const { data, isLoading, error } = useClarity();

  const totalFrustration =
    (data?.frustration.deadClicks ?? 0) +
    (data?.frustration.rageClicks ?? 0) +
    (data?.frustration.quickbacks ?? 0) +
    (data?.frustration.errorClicks ?? 0);

  return (
    <div>
      <PageHeader
        title="UX Insights"
        description="User behavior analytics powered by Microsoft Clarity (last 3 days)"
      />

      {error && (
        <ErrorDisplay message="Failed to load Clarity data. Check your Clarity credentials." />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <KPICard
          title="Sessions"
          value={data?.traffic.totalSessions ?? 0}
          formattedValue={formatNumber(data?.traffic.totalSessions ?? 0)}
          icon={Eye}
          isLoading={isLoading}
        />
        <KPICard
          title="Unique Users"
          value={data?.traffic.distinctUsers ?? 0}
          formattedValue={formatNumber(data?.traffic.distinctUsers ?? 0)}
          icon={Users}
          isLoading={isLoading}
        />
        <KPICard
          title="Pages / Session"
          value={data?.traffic.pagesPerSession ?? 0}
          formattedValue={(data?.traffic.pagesPerSession ?? 0).toFixed(2)}
          icon={BarChart3}
          isLoading={isLoading}
        />
        <KPICard
          title="Avg Scroll Depth"
          value={data?.scrollDepth ?? 0}
          formattedValue={`${(data?.scrollDepth ?? 0).toFixed(1)}%`}
          icon={ArrowDownUp}
          isLoading={isLoading}
        />
        <KPICard
          title="Active Time"
          value={data?.engagement.activeTime ?? 0}
          formattedValue={formatSeconds(data?.engagement.activeTime ?? 0)}
          icon={Clock}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dead Clicks
            </CardTitle>
            <CircleDot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(data?.frustration.deadClicks ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clicks on non-interactive elements
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rage Clicks
            </CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(data?.frustration.rageClicks ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Rapid repeated clicks from frustration
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Backs
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(data?.frustration.quickbacks ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users who navigated back quickly
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Frustration Signals
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatNumber(totalFrustration)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Combined frustration events
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <BreakdownCard
          title="Devices"
          icon={Monitor}
          items={data?.devices ?? []}
          isLoading={isLoading}
        />
        <BreakdownCard
          title="Browsers"
          icon={Globe}
          items={data?.browsers ?? []}
          isLoading={isLoading}
        />
        <BreakdownCard
          title="Countries"
          icon={Globe}
          items={data?.countries ?? []}
          isLoading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.topPages ?? []).map((page) => (
                  <TableRow key={page.url}>
                    <TableCell className="font-mono text-xs" title={page.url}>
                      {shortenUrl(page.url)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(page.visits)}
                    </TableCell>
                  </TableRow>
                ))}
                {(data?.topPages ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No page data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
