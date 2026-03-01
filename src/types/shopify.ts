export interface ShopifyMoneySet {
  shopMoney: {
    amount: string;
    currencyCode: string;
  };
}

export interface ShopifyLineItem {
  title: string;
  quantity: number;
  originalTotalSet: ShopifyMoneySet;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  customer: { displayName: string; email: string | null } | null;
  currentTotalPriceSet: ShopifyMoneySet;
  totalDiscountsSet: ShopifyMoneySet;
  subtotalPriceSet: ShopifyMoneySet;
  lineItems: {
    edges: Array<{ node: ShopifyLineItem }>;
  };
}

export interface OrderListItem {
  name: string;
  createdAt: string;
  customerName: string;
  customerEmail?: string;
  total: number;
  currency: string;
  profileName?: string;
  profileColor?: string;
}

export interface ShopifyOrderEdge {
  node: ShopifyOrder;
  cursor: string;
}

export interface ShopifyOrdersConnection {
  orders: {
    edges: ShopifyOrderEdge[];
    pageInfo: {
      hasNextPage: boolean;
    };
  };
}

export interface OrdersAggregate {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  currency: string;
  dailyRevenue: DailyRevenue[];
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  title: string;
  totalRevenue: number;
  totalQuantitySold: number;
  orderCount: number;
}

export interface AnalyticsData {
  conversionRate: number | null;
  checkoutSessions: number;
  checkoutCount: number;
  revenueTrend: Array<{ date: string; revenue: number }>;
  orderTrend: Array<{ date: string; count: number }>;
  periodComparison: {
    currentPeriodRevenue: number;
    previousPeriodRevenue: number;
    percentChange: number;
  };
}
