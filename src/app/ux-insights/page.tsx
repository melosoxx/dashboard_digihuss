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
import { KPICard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { ClarityHeatmapLink } from "@/components/clarity/clarity-heatmap-link";
import { ClarityFetchControl } from "@/components/clarity/clarity-fetch-control";
import { useClarity } from "@/hooks/use-clarity";
import { useDateRange } from "@/providers/date-range-provider";
import { formatNumber } from "@/lib/utils";

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
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
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Sin datos</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function UXInsightsPage() {
  const { dateRange } = useDateRange();
  const {
    data,
    isLoading,
    isFetching,
    error,
    fetchClarity,
    loadCache,
    isLoadingCache,
    fetchedAt,
    rateLimited,
    versions,
    selectedVersionId,
    selectVersion,
  } = useClarity();

  const totalFrustration =
    (data?.frustration.deadClicks ?? 0) +
    (data?.frustration.rageClicks ?? 0) +
    (data?.frustration.quickbacks ?? 0) +
    (data?.frustration.errorClicks ?? 0);

  return (
    <div>
      <PageHeader
        title="Insights de UX"
        description="Analíticas de comportamiento de usuario con Microsoft Clarity (máximo 3 días)"
      />

      {error && (
        <ErrorDisplay message="Error al cargar datos de Clarity. Verificá tus credenciales de Clarity." />
      )}

      {/* Clarity Controls + Heatmap Link — horizontal */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mb-6">
        <ClarityFetchControl
          isFetching={isFetching}
          isLoadingCache={isLoadingCache}
          hasData={!!data}
          fetchedAt={fetchedAt}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          rateLimited={rateLimited}
          onLoadCache={loadCache}
          onFetch={fetchClarity}
          versions={versions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={selectVersion}
        />
        <ClarityHeatmapLink isLoading={isLoading} />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <KPICard
          title="Sesiones"
          value={data?.traffic.totalSessions ?? 0}
          formattedValue={formatNumber(data?.traffic.totalSessions ?? 0)}
          icon={Eye}
          iconClassName="text-blue-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Usuarios Únicos"
          value={data?.traffic.distinctUsers ?? 0}
          formattedValue={formatNumber(data?.traffic.distinctUsers ?? 0)}
          icon={Users}
          iconClassName="text-violet-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Páginas / Sesión"
          value={data?.traffic.pagesPerSession ?? 0}
          formattedValue={(data?.traffic.pagesPerSession ?? 0).toFixed(2)}
          icon={BarChart3}
          iconClassName="text-teal-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Profundidad de Scroll"
          value={data?.scrollDepth ?? 0}
          formattedValue={`${(data?.scrollDepth ?? 0).toFixed(1)}%`}
          icon={ArrowDownUp}
          iconClassName="text-amber-500"
          isLoading={isLoading}
        />
        <KPICard
          title="Tiempo Activo"
          value={data?.engagement.activeTime ?? 0}
          formattedValue={formatSeconds(data?.engagement.activeTime ?? 0)}
          icon={Clock}
          iconClassName="text-emerald-500"
          isLoading={isLoading}
        />
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <BreakdownCard
          title="Dispositivos"
          icon={Monitor}
          items={data?.devices ?? []}
          isLoading={isLoading}
        />
        <BreakdownCard
          title="Navegadores"
          icon={Globe}
          items={data?.browsers ?? []}
          isLoading={isLoading}
        />
        <BreakdownCard
          title="Países"
          icon={Globe}
          items={data?.countries ?? []}
          isLoading={isLoading}
        />
      </div>

      {/* Frustration signals */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clics Muertos
            </CardTitle>
            <CircleDot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-500">
                  {formatNumber(data?.frustration.deadClicks ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clics en elementos no interactivos
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clics de Rabia
            </CardTitle>
            <Flame className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-500">
                  {formatNumber(data?.frustration.rageClicks ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clics rápidos repetidos por frustración
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Retornos Rápidos
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-500">
                  {formatNumber(data?.frustration.quickbacks ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Usuarios que volvieron atrás rápidamente
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Señales de Frustración
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-500">
                  {formatNumber(totalFrustration)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Eventos de frustración combinados
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
