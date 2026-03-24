"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  Lightbulb,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  Zap,
  AlertTriangle,
  Info,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/dashboard/kpi-card";
import type { KPIDetailItem } from "@/components/dashboard/kpi-card";
import { formatNumber, cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import type { MetaActiveAd, MetaAccountInsights } from "@/types/meta";

interface AdsResumenTabProps {
  metaAds: {
    activeAds: MetaActiveAd[];
    inactiveAds: MetaActiveAd[];
  } | undefined;
  metaAccount: MetaAccountInsights | undefined;
  promotionsData: MetaAccountInsights | undefined;
  promotionAds: MetaActiveAd[];
  promotionsConfigured: boolean;
  isLoading: boolean;
  dayCount: number;
}

const COLORS = {
  meta: "#3b82f6",
  promo: "#d946ef",
};

type Insight = {
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  icon: typeof TrendingUp;
};

export function AdsResumenTab({
  metaAds,
  metaAccount,
  promotionsData,
  promotionAds,
  promotionsConfigured,
  isLoading,
  dayCount,
}: AdsResumenTabProps) {
  const { formatMoney } = useCurrency();

  // ── Combined metrics ────────────────────────────────────────────────
  const combined = useMemo(() => {
    const metaSpend = metaAds?.activeAds.reduce((s, ad) => s + ad.spend, 0) ?? 0;
    const metaImpressions = metaAds?.activeAds.reduce((s, ad) => s + ad.impressions, 0) ?? 0;
    const metaClicks = metaAds?.activeAds.reduce((s, ad) => s + ad.clicks, 0) ?? 0;

    const promoSpend = promotionsData?.spend ?? 0;
    const promoImpressions = promotionsData?.impressions ?? 0;
    const promoClicks = promotionsData?.clicks ?? 0;

    const totalSpend = metaSpend + promoSpend;
    const totalImpressions = metaImpressions + promoImpressions;
    const totalClicks = metaClicks + promoClicks;
    const totalCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const totalCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    const metaCtr = metaImpressions > 0 ? (metaClicks / metaImpressions) * 100 : 0;
    const metaCpc = metaClicks > 0 ? metaSpend / metaClicks : 0;
    const promoCtr = promoImpressions > 0 ? (promoClicks / promoImpressions) * 100 : 0;
    const promoCpc = promoClicks > 0 ? promoSpend / promoClicks : 0;
    const metaCpm = metaImpressions > 0 ? (metaSpend / metaImpressions) * 1000 : 0;
    const promoCpm = promoImpressions > 0 ? (promoSpend / promoImpressions) * 1000 : 0;

    return {
      metaSpend, metaImpressions, metaClicks, metaCtr, metaCpc, metaCpm,
      promoSpend, promoImpressions, promoClicks, promoCtr, promoCpc, promoCpm,
      totalSpend, totalImpressions, totalClicks, totalCtr, totalCpc,
      roas: metaAccount?.roas ?? 0,
      conversions: metaAccount?.conversions ?? 0,
      purchaseRevenue: metaAccount?.purchaseRevenue ?? 0,
    };
  }, [metaAds, promotionsData, metaAccount]);

  // ── KPI detail items ────────────────────────────────────────────────
  const spendDetails: KPIDetailItem[] = useMemo(() => {
    const items: KPIDetailItem[] = [];
    if (combined.metaSpend > 0) items.push({ label: "Meta Ads", value: formatMoney(combined.metaSpend) });
    if (combined.promoSpend > 0) items.push({ label: "Promos Instagram", value: formatMoney(combined.promoSpend) });
    if (combined.totalSpend > 0) {
      const metaPct = ((combined.metaSpend / combined.totalSpend) * 100).toFixed(0);
      items.push({ label: "% en Meta Ads", value: `${metaPct}%` });
    }
    return items;
  }, [combined, formatMoney]);

  const cpcDetails: KPIDetailItem[] = useMemo(() => {
    const items: KPIDetailItem[] = [];
    if (combined.metaCpc > 0) items.push({ label: "CPC Meta Ads", value: formatMoney(combined.metaCpc) });
    if (combined.promoCpc > 0) items.push({ label: "CPC Promos IG", value: formatMoney(combined.promoCpc) });
    const better = combined.metaCpc > 0 && combined.promoCpc > 0
      ? (combined.metaCpc < combined.promoCpc ? "Meta Ads" : "Promos IG")
      : null;
    if (better) items.push({ label: "Más eficiente", value: better, highlighted: true });
    return items;
  }, [combined, formatMoney]);

  // ── Comparison table rows ───────────────────────────────────────────
  const comparisonRows = useMemo(() => {
    type Row = { label: string; meta: string; promo: string; winner: "meta" | "promo" | "tie" | "none" };
    const rows: Row[] = [];

    rows.push({
      label: "Gasto",
      meta: formatMoney(combined.metaSpend),
      promo: formatMoney(combined.promoSpend),
      winner: "none",
    });
    rows.push({
      label: "Impresiones",
      meta: formatNumber(combined.metaImpressions),
      promo: formatNumber(combined.promoImpressions),
      winner: combined.metaImpressions > combined.promoImpressions ? "meta"
        : combined.promoImpressions > combined.metaImpressions ? "promo" : "tie",
    });
    rows.push({
      label: "Clics",
      meta: formatNumber(combined.metaClicks),
      promo: formatNumber(combined.promoClicks),
      winner: combined.metaClicks > combined.promoClicks ? "meta"
        : combined.promoClicks > combined.metaClicks ? "promo" : "tie",
    });
    rows.push({
      label: "CTR",
      meta: `${combined.metaCtr.toFixed(2)}%`,
      promo: `${combined.promoCtr.toFixed(2)}%`,
      winner: combined.metaCtr > combined.promoCtr ? "meta"
        : combined.promoCtr > combined.metaCtr ? "promo" : "tie",
    });
    rows.push({
      label: "CPC",
      meta: combined.metaCpc > 0 ? formatMoney(combined.metaCpc) : "—",
      promo: combined.promoCpc > 0 ? formatMoney(combined.promoCpc) : "—",
      winner: combined.metaCpc > 0 && combined.promoCpc > 0
        ? (combined.metaCpc < combined.promoCpc ? "meta" : combined.promoCpc < combined.metaCpc ? "promo" : "tie")
        : "none",
    });
    rows.push({
      label: "CPM",
      meta: combined.metaCpm > 0 ? formatMoney(combined.metaCpm) : "—",
      promo: combined.promoCpm > 0 ? formatMoney(combined.promoCpm) : "—",
      winner: combined.metaCpm > 0 && combined.promoCpm > 0
        ? (combined.metaCpm < combined.promoCpm ? "meta" : combined.promoCpm < combined.metaCpm ? "promo" : "tie")
        : "none",
    });

    return rows;
  }, [combined, formatMoney]);

  // ── Insights ────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const list: Insight[] = [];
    if (isLoading || combined.totalSpend === 0) return list;

    if (combined.metaCtr > 0 && combined.promoCtr > 0) {
      const winner = combined.metaCtr > combined.promoCtr ? "Meta Ads" : "Promos IG";
      const diff = Math.abs(combined.metaCtr - combined.promoCtr).toFixed(2);
      list.push({ type: "info", title: `${winner} tiene mejor CTR (+${diff}pp)`, message: `Mejor tasa de clics en este canal.`, icon: Target });
    }

    if (combined.metaCpc > 0 && combined.promoCpc > 0) {
      const cheaper = combined.metaCpc < combined.promoCpc ? "Meta Ads" : "Promos IG";
      const savings = Math.abs(combined.metaCpc - combined.promoCpc);
      list.push({ type: "success", title: `${cheaper}: CPC más bajo`, message: `Ahorrás ${formatMoney(savings)}/clic vs el otro canal.`, icon: DollarSign });
    }

    if (combined.roas > 0) {
      if (combined.roas >= 3) {
        list.push({ type: "success", title: `ROAS excelente: ${combined.roas.toFixed(2)}x`, message: `Gran retorno sobre la inversión publicitaria.`, icon: TrendingUp });
      } else if (combined.roas >= 1) {
        list.push({ type: "info", title: `ROAS aceptable: ${combined.roas.toFixed(2)}x`, message: `Recuperás la inversión pero hay margen de mejora.`, icon: Info });
      } else {
        list.push({ type: "warning", title: `ROAS bajo: ${combined.roas.toFixed(2)}x`, message: `No se recupera la inversión. Revisá campañas.`, icon: AlertTriangle });
      }
    }

    if (combined.metaSpend > 0 && combined.promoSpend > 0) {
      const metaPct = (combined.metaSpend / combined.totalSpend) * 100;
      if (metaPct > 80) {
        list.push({ type: "info", title: "Presupuesto concentrado en Meta Ads", message: `${metaPct.toFixed(0)}% de la inversión. Considerá diversificar.`, icon: Lightbulb });
      } else if (metaPct < 20) {
        list.push({ type: "info", title: "Presupuesto concentrado en Promos IG", message: `${(100 - metaPct).toFixed(0)}% de la inversión. Meta Ads tiene mejor segmentación.`, icon: Lightbulb });
      }
    }

    if (combined.metaCpm > 0 && combined.promoCpm > 0) {
      const cheaperReach = combined.metaCpm < combined.promoCpm ? "Meta Ads" : "Promos IG";
      list.push({ type: "info", title: `${cheaperReach}: mejor alcance por peso`, message: `CPM más bajo = más impresiones por la misma inversión.`, icon: Eye });
    }

    const allActiveAds: (MetaActiveAd & { source: string })[] = [];
    (metaAds?.activeAds ?? []).forEach((ad) => allActiveAds.push({ ...ad, source: "Meta Ads" }));
    promotionAds.filter((ad) => ad.effectiveStatus === "ACTIVE").forEach((ad) => allActiveAds.push({ ...ad, source: "Promo IG" }));
    const bestAd = allActiveAds.filter((ad) => ad.impressions > 0).sort((a, b) => b.ctr - a.ctr)[0];
    if (bestAd && bestAd.ctr >= 3) {
      list.push({ type: "success", title: `Top: "${bestAd.adName.substring(0, 25)}"`, message: `CTR ${bestAd.ctr.toFixed(2)}% en ${bestAd.source}. Escalar este creativo.`, icon: Zap });
    }

    return list.slice(0, 6);
  }, [isLoading, combined, formatMoney, metaAds, promotionAds]);

  if (isLoading) {
    return (
      <div className="h-full flex gap-3">
        <div className="w-1/3 min-w-0 flex-shrink-0 grid gap-3 grid-cols-2 grid-rows-3 items-start">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden py-0 gap-0">
              <CardContent className="px-3 py-2">
                <Skeleton className="h-3 w-20 mb-1.5" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-3 w-16 mt-1" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex-1 min-w-0 flex gap-3">
          <Card className="flex-1"><CardContent className="py-4"><Skeleton className="h-full w-full min-h-[200px]" /></CardContent></Card>
          <Card className="flex-1"><CardContent className="py-4"><Skeleton className="h-full w-full min-h-[200px]" /></CardContent></Card>
        </div>
      </div>
    );
  }

  const noData = combined.totalSpend === 0 && !promotionsConfigured;

  if (noData) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No hay datos de anuncios para el periodo seleccionado.</p>
      </div>
    );
  }

  const hasBothChannels = combined.metaSpend > 0 && combined.promoSpend > 0;
  const metaSpendPct = combined.totalSpend > 0 ? (combined.metaSpend / combined.totalSpend) * 100 : 0;
  const promoSpendPct = combined.totalSpend > 0 ? (combined.promoSpend / combined.totalSpend) * 100 : 0;

  return (
    <div className="h-full flex gap-3 overflow-hidden">
      {/* ── Left 1/3: KPI Cards ───────────────────────────────────────── */}
      <div className="w-1/3 min-w-0 flex-shrink-0 grid gap-3 grid-cols-2 grid-rows-3 items-start content-start">
        <KPICard
          title="Inversión Total"
          value={combined.totalSpend}
          formattedValue={formatMoney(combined.totalSpend)}
          icon={DollarSign}
          iconClassName="text-emerald-500"
          detailItems={spendDetails}
          subtitle={`~${formatMoney(combined.totalSpend / dayCount)}/día`}
        />
        <KPICard
          title="Impresiones Totales"
          value={combined.totalImpressions}
          formattedValue={formatNumber(combined.totalImpressions)}
          icon={Eye}
          iconClassName="text-blue-500"
          detailItems={[
            ...(combined.metaImpressions > 0 ? [{ label: "Meta Ads", value: formatNumber(combined.metaImpressions) }] : []),
            ...(combined.promoImpressions > 0 ? [{ label: "Promos IG", value: formatNumber(combined.promoImpressions) }] : []),
          ]}
          subtitle={`~${formatNumber(Math.round(combined.totalImpressions / dayCount))}/día`}
        />
        <KPICard
          title="CPC Promedio"
          value={combined.totalCpc}
          formattedValue={formatMoney(combined.totalCpc)}
          icon={MousePointerClick}
          iconClassName="text-violet-500"
          detailItems={cpcDetails}
          subtitle={`${formatNumber(combined.totalClicks)} clics totales`}
        />
        <KPICard
          title="CTR Combinado"
          value={combined.totalCtr}
          formattedValue={`${combined.totalCtr.toFixed(2)}%`}
          icon={Target}
          iconClassName="text-amber-500"
          detailItems={[
            ...(combined.metaCtr > 0 ? [{ label: "CTR Meta Ads", value: `${combined.metaCtr.toFixed(2)}%`, highlighted: combined.metaCtr >= combined.totalCtr }] : []),
            ...(combined.promoCtr > 0 ? [{ label: "CTR Promos IG", value: `${combined.promoCtr.toFixed(2)}%`, highlighted: combined.promoCtr >= combined.totalCtr }] : []),
          ]}
          subtitle={`${formatNumber(combined.totalImpressions)} impresiones`}
        />
        <KPICard
          title="CPM Combinado"
          value={combined.totalImpressions > 0 ? (combined.totalSpend / combined.totalImpressions) * 1000 : 0}
          formattedValue={combined.totalImpressions > 0 ? formatMoney((combined.totalSpend / combined.totalImpressions) * 1000) : formatMoney(0)}
          icon={BarChart3}
          iconClassName="text-indigo-500"
          detailItems={[
            ...(combined.metaCpm > 0 ? [{ label: "CPM Meta Ads", value: formatMoney(combined.metaCpm) }] : []),
            ...(combined.promoCpm > 0 ? [{ label: "CPM Promos IG", value: formatMoney(combined.promoCpm) }] : []),
          ]}
          subtitle="costo por mil impr."
        />
        <KPICard
          title="ROAS"
          value={combined.roas}
          formattedValue={`${combined.roas.toFixed(2)}x`}
          icon={TrendingUp}
          iconClassName={combined.roas >= 3 ? "text-emerald-500" : combined.roas >= 1 ? "text-amber-500" : "text-red-500"}
          detailItems={[
            ...(combined.conversions > 0 ? [{ label: "Conversiones", value: formatNumber(combined.conversions) }] : []),
            ...(combined.purchaseRevenue > 0 ? [{ label: "Revenue", value: formatMoney(combined.purchaseRevenue) }] : []),
          ]}
          subtitle={combined.roas >= 3 ? "excelente" : combined.roas >= 1 ? "aceptable" : "bajo"}
        />
      </div>

      {/* ── Right 2/3: Insights + Comparison ──────────────────────────── */}
      <div className="flex-1 min-w-0 flex gap-3 overflow-hidden">
        {/* Insights */}
        <Card className="flex-1 min-w-0 overflow-hidden py-0 gap-0 flex flex-col">
          <CardContent className="px-4 py-0 flex flex-col flex-1 min-h-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-card py-3 z-10 flex-shrink-0">Insights</p>
            <div className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto pb-3">
              {insights.length > 0 ? insights.map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 pl-2.5 border-l-[3px] py-0.5",
                      insight.type === "success" && "border-l-emerald-500",
                      insight.type === "warning" && "border-l-amber-500",
                      insight.type === "info" && "border-l-blue-500",
                    )}
                  >
                    <Icon className={cn(
                      "h-3.5 w-3.5 mt-0.5 flex-shrink-0",
                      insight.type === "success" && "text-emerald-500",
                      insight.type === "warning" && "text-amber-500",
                      insight.type === "info" && "text-blue-500",
                    )} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold leading-tight">{insight.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug">{insight.message}</p>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-xs text-muted-foreground">No hay suficientes datos para generar insights.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comparison table */}
        {hasBothChannels ? (
          <Card className="flex-1 min-w-0 overflow-hidden py-0 gap-0 flex flex-col">
            <CardContent className="px-0 py-0 flex-1 min-h-0 flex flex-col">
              <div className="px-4 pt-3 pb-2 flex-shrink-0 border-b border-border/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Comparativa de Canales</p>
                <p className="text-[10px] text-muted-foreground mb-1">Distribución de gasto</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-5 rounded-full overflow-hidden flex bg-muted/30">
                    <div
                      className="h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                      style={{ width: `${Math.max(metaSpendPct, 8)}%`, backgroundColor: COLORS.meta }}
                    >
                      {metaSpendPct >= 15 ? `${metaSpendPct.toFixed(0)}%` : ""}
                    </div>
                    <div
                      className="h-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                      style={{ width: `${Math.max(promoSpendPct, 8)}%`, backgroundColor: COLORS.promo }}
                    >
                      {promoSpendPct >= 15 ? `${promoSpendPct.toFixed(0)}%` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-blue-500 font-medium">Meta Ads</span>
                  <span className="text-[10px] text-fuchsia-500 font-medium">Promos IG</span>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border/40">
                      <th className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-left py-2 px-4 w-[28%]">Métrica</th>
                      <th className="text-[10px] font-semibold uppercase tracking-wider text-center py-2 px-2 w-[28%]">
                        <span className="text-blue-500">Meta Ads</span>
                      </th>
                      <th className="text-[10px] font-semibold uppercase tracking-wider text-center py-2 px-2 w-[28%]">
                        <span className="text-fuchsia-500">Promos IG</span>
                      </th>
                      <th className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center py-2 pr-4 w-[16%]">Mejor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.label} className="border-b border-border/10 last:border-0">
                        <td className="py-2.5 px-4 text-[12px] font-medium text-muted-foreground">{row.label}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={cn(
                            "text-[13px] font-semibold",
                            row.winner === "meta" && "text-blue-600 dark:text-blue-400",
                          )}>
                            {row.meta}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={cn(
                            "text-[13px] font-semibold",
                            row.winner === "promo" && "text-fuchsia-600 dark:text-fuchsia-400",
                          )}>
                            {row.promo}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-center">
                          {row.winner === "meta" && (
                            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.meta }} />
                          )}
                          {row.winner === "promo" && (
                            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.promo }} />
                          )}
                          {row.winner === "tie" && (
                            <span className="text-[10px] text-muted-foreground">=</span>
                          )}
                          {row.winner === "none" && (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 min-w-0 overflow-hidden py-0 gap-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground px-4 text-center">
              Activá ambos canales (Meta Ads + Promos IG) para ver la comparativa.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
