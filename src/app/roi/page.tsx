"use client";

import { DollarSign, Percent, Target, ArrowDownUp } from "lucide-react";
import { useShopifyOrders } from "@/hooks/use-shopify-orders";
import { useMetaAccount } from "@/hooks/use-meta-account";
import { KPICard } from "@/components/dashboard/kpi-card";
import { SpendVsRevenueChart } from "@/components/roi/spend-vs-revenue";
import { CPAChart } from "@/components/roi/cpa-chart";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { formatCurrency } from "@/lib/utils";
import { useMemo } from "react";

export default function ROIAnalysisPage() {
  const shopify = useShopifyOrders();
  const meta = useMetaAccount();

  const isLoading = shopify.isLoading || meta.isLoading;
  const hasError = shopify.error || meta.error;

  const revenue = shopify.data?.totalRevenue ?? 0;
  const adSpend = meta.data?.spend ?? 0;
  const netProfit = revenue - adSpend;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const cpa = meta.data?.costPerAcquisition ?? 0;
  const spendToRevenueRatio = revenue > 0 ? (adSpend / revenue) * 100 : 0;

  const combinedData = useMemo(() => {
    const revenueByDate = new Map<string, number>();
    const spendByDate = new Map<string, number>();

    for (const day of shopify.data?.dailyRevenue ?? []) {
      revenueByDate.set(day.date, day.revenue);
    }
    for (const day of meta.data?.dailyMetrics ?? []) {
      spendByDate.set(day.date, day.spend);
    }

    const allDates = new Set([...revenueByDate.keys(), ...spendByDate.keys()]);
    return Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        revenue: revenueByDate.get(date) ?? 0,
        adSpend: spendByDate.get(date) ?? 0,
      }));
  }, [shopify.data, meta.data]);

  const cpaData = useMemo(() => {
    return (meta.data?.dailyMetrics ?? []).map((day) => ({
      date: day.date,
      cpa: day.clicks > 0 ? day.spend / day.clicks : 0,
    }));
  }, [meta.data]);

  return (
    <div>
      <PageHeader
        title="ROI Analysis"
        description="Combined revenue vs ad spend analysis across Shopify and Meta Ads"
      />

      {hasError && <ErrorDisplay message="Failed to load ROI data. Check your API connections." />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard
          title="Net Profit"
          value={netProfit}
          formattedValue={formatCurrency(netProfit)}
          icon={DollarSign}
          isLoading={isLoading}
          trend={{
            value: profitMargin,
            direction: netProfit > 0 ? "up" : netProfit < 0 ? "down" : "neutral",
            isPositive: netProfit >= 0,
          }}
        />
        <KPICard
          title="Profit Margin"
          value={profitMargin}
          formattedValue={`${profitMargin.toFixed(1)}%`}
          icon={Percent}
          isLoading={isLoading}
        />
        <KPICard
          title="Cost Per Acquisition"
          value={cpa}
          formattedValue={formatCurrency(cpa)}
          icon={Target}
          isLoading={isLoading}
        />
        <KPICard
          title="Ad Spend / Revenue"
          value={spendToRevenueRatio}
          formattedValue={`${spendToRevenueRatio.toFixed(1)}%`}
          icon={ArrowDownUp}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <SpendVsRevenueChart data={combinedData} isLoading={isLoading} />
        <CPAChart data={cpaData} isLoading={isLoading} />
      </div>
    </div>
  );
}
