"use client";

import { DollarSign, Eye, MousePointerClick, TrendingUp, BarChart3 } from "lucide-react";
import { useMetaAccount } from "@/hooks/use-meta-account";
import { useMetaCampaigns } from "@/hooks/use-meta-campaigns";
import { KPICard } from "@/components/dashboard/kpi-card";
import { SpendChart } from "@/components/ads/spend-chart";
import { ROASChart } from "@/components/ads/roas-chart";
import { CampaignTable } from "@/components/ads/campaign-table";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { formatCurrency, formatNumber, formatCompactNumber } from "@/lib/utils";

export default function AdPerformancePage() {
  const account = useMetaAccount();
  const campaigns = useMetaCampaigns();

  const hasError = account.error || campaigns.error;

  return (
    <div>
      <PageHeader
        title="Ad Performance"
        description="Meta Ads campaign metrics and spending analytics"
      />

      {hasError && <ErrorDisplay message="Failed to load Meta Ads data. Check your Meta connection or token expiration." />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <KPICard
          title="ROAS"
          value={account.data?.roas ?? 0}
          formattedValue={`${(account.data?.roas ?? 0).toFixed(2)}x`}
          icon={TrendingUp}
          isLoading={account.isLoading}
        />
        <KPICard
          title="Total Spend"
          value={account.data?.spend ?? 0}
          formattedValue={formatCurrency(account.data?.spend ?? 0)}
          icon={DollarSign}
          isLoading={account.isLoading}
        />
        <KPICard
          title="CPC"
          value={account.data?.cpc ?? 0}
          formattedValue={formatCurrency(account.data?.cpc ?? 0)}
          icon={MousePointerClick}
          isLoading={account.isLoading}
        />
        <KPICard
          title="CTR"
          value={account.data?.ctr ?? 0}
          formattedValue={`${(account.data?.ctr ?? 0).toFixed(2)}%`}
          icon={BarChart3}
          isLoading={account.isLoading}
        />
        <KPICard
          title="Impressions"
          value={account.data?.impressions ?? 0}
          formattedValue={formatCompactNumber(account.data?.impressions ?? 0)}
          icon={Eye}
          isLoading={account.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <SpendChart
          data={account.data?.dailyMetrics ?? []}
          isLoading={account.isLoading}
        />
        <ROASChart
          data={account.data?.dailyMetrics ?? []}
          isLoading={account.isLoading}
        />
      </div>

      <CampaignTable
        campaigns={campaigns.data?.campaigns ?? []}
        isLoading={campaigns.isLoading}
      />
    </div>
  );
}
