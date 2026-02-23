"use client";

import { DollarSign, Eye, MousePointerClick, TrendingUp, BarChart3 } from "lucide-react";
import { useMetaAccount } from "@/hooks/use-meta-account";
import { useMetaCampaigns, useMetaAds, useMetaAdsets } from "@/hooks/use-meta-campaigns";
import { KPICard } from "@/components/dashboard/kpi-card";
import { SpendChart } from "@/components/ads/spend-chart";
import { CampaignTable } from "@/components/ads/campaign-table";
import { AdsetTable } from "@/components/ads/adset-table";
import { ActiveAdsCard } from "@/components/panel/top-campaigns-card";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { formatCurrency, formatNumber, formatCompactNumber } from "@/lib/utils";

export default function AdPerformancePage() {
  const account = useMetaAccount();
  const campaigns = useMetaCampaigns();
  const ads = useMetaAds();
  const adsets = useMetaAdsets();

  const hasError = account.error || campaigns.error;

  return (
    <div>
      <PageHeader
        title="Rendimiento de Publicidad"
        description="Métricas de campañas y analíticas de gasto en Meta Ads"
      />

      {hasError && <ErrorDisplay message="Error al cargar datos de Meta Ads. Verificá tu conexión o si el token expiró." />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <KPICard
          title="ROAS"
          value={account.data?.roas ?? 0}
          formattedValue={`${(account.data?.roas ?? 0).toFixed(2)}x`}
          icon={TrendingUp}
          iconClassName="text-teal-500"
          isLoading={account.isLoading}
        />
        <KPICard
          title="Gasto Total"
          value={account.data?.spend ?? 0}
          formattedValue={formatCurrency(account.data?.spend ?? 0)}
          icon={DollarSign}
          iconClassName="text-red-500"
          isLoading={account.isLoading}
        />
        <KPICard
          title="CPC"
          value={account.data?.cpc ?? 0}
          formattedValue={formatCurrency(account.data?.cpc ?? 0)}
          icon={MousePointerClick}
          iconClassName="text-orange-500"
          isLoading={account.isLoading}
        />
        <KPICard
          title="CTR"
          value={account.data?.ctr ?? 0}
          formattedValue={`${(account.data?.ctr ?? 0).toFixed(2)}%`}
          icon={BarChart3}
          iconClassName="text-blue-500"
          isLoading={account.isLoading}
        />
        <KPICard
          title="Impresiones"
          value={account.data?.impressions ?? 0}
          formattedValue={formatCompactNumber(account.data?.impressions ?? 0)}
          icon={Eye}
          iconClassName="text-violet-500"
          isLoading={account.isLoading}
        />
      </div>

      <div className="mb-6">
        <SpendChart
          data={account.data?.dailyMetrics ?? []}
          isLoading={account.isLoading}
        />
      </div>

      <div className="space-y-6">
        <CampaignTable
          campaigns={campaigns.data?.campaigns ?? []}
          isLoading={campaigns.isLoading}
        />

        <AdsetTable
          adsets={adsets.data?.adsets ?? []}
          isLoading={adsets.isLoading}
        />

        <ActiveAdsCard
          ads={ads.data?.ads ?? []}
          isLoading={ads.isLoading}
        />
      </div>
    </div>
  );
}
