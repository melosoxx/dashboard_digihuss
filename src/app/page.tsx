"use client";

import { DollarSign, ShoppingCart, Receipt, Percent } from "lucide-react";
import { useShopifyOrders } from "@/hooks/use-shopify-orders";
import { useShopifyProducts } from "@/hooks/use-shopify-products";
import { useShopifyAnalytics } from "@/hooks/use-shopify-analytics";
import { KPICard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { OrdersChart } from "@/components/dashboard/orders-chart";
import { TopProductsTable } from "@/components/dashboard/top-products-table";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";

export default function SalesOverviewPage() {
  const orders = useShopifyOrders();
  const products = useShopifyProducts();
  const analytics = useShopifyAnalytics();

  const hasError = orders.error || products.error || analytics.error;
  const comparison = analytics.data?.periodComparison;

  return (
    <div>
      <PageHeader
        title="Sales Overview"
        description="Revenue, orders, and product performance from Shopify"
      />

      {hasError && <ErrorDisplay message="Failed to load sales data. Check your Shopify connection." />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard
          title="Total Revenue"
          value={orders.data?.totalRevenue ?? 0}
          formattedValue={formatCurrency(orders.data?.totalRevenue ?? 0)}
          icon={DollarSign}
          isLoading={orders.isLoading}
          trend={
            comparison
              ? {
                  value: comparison.percentChange,
                  direction: comparison.percentChange > 0 ? "up" : comparison.percentChange < 0 ? "down" : "neutral",
                  isPositive: comparison.percentChange >= 0,
                }
              : undefined
          }
        />
        <KPICard
          title="Orders"
          value={orders.data?.orderCount ?? 0}
          formattedValue={formatNumber(orders.data?.orderCount ?? 0)}
          icon={ShoppingCart}
          isLoading={orders.isLoading}
        />
        <KPICard
          title="Avg Order Value"
          value={orders.data?.averageOrderValue ?? 0}
          formattedValue={formatCurrency(orders.data?.averageOrderValue ?? 0)}
          icon={Receipt}
          isLoading={orders.isLoading}
        />
        <KPICard
          title="Conversion Rate"
          value={0}
          formattedValue={analytics.data?.conversionRate != null ? formatPercentage(analytics.data.conversionRate) : "N/A"}
          icon={Percent}
          isLoading={analytics.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <RevenueChart
          data={orders.data?.dailyRevenue ?? []}
          isLoading={orders.isLoading}
        />
        <OrdersChart
          data={orders.data?.dailyRevenue ?? []}
          isLoading={orders.isLoading}
        />
      </div>

      <TopProductsTable
        products={products.data?.topProducts ?? []}
        isLoading={products.isLoading}
      />
    </div>
  );
}
