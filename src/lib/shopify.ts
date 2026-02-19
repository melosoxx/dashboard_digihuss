import "server-only";
import type {
  ShopifyOrdersConnection,
  ShopifyOrder,
  OrdersAggregate,
  DailyRevenue,
  TopProduct,
} from "@/types/shopify";

const ORDERS_QUERY = `
  query GetOrders($query: String!, $cursor: String) {
    orders(first: 50, after: $cursor, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          displayFinancialStatus
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalDiscountsSet {
            shopMoney {
              amount
            }
          }
          subtotalPriceSet {
            shopMoney {
              amount
            }
          }
          lineItems(first: 20) {
            edges {
              node {
                title
                quantity
                originalTotalSet {
                  shopMoney {
                    amount
                  }
                }
              }
            }
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

class ShopifyClient {
  private endpoint: string;
  private accessToken: string;

  constructor() {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const version = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";
    const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!domain || !token) {
      throw new Error("Missing Shopify environment variables");
    }

    this.endpoint = `https://${domain}/admin/api/${version}/graphql.json`;
    this.accessToken = token;
  }

  private async query<T>(graphqlQuery: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
      },
      body: JSON.stringify({ query: graphqlQuery, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Shopify error details:", { status: response.status, body: errorBody, endpoint: this.endpoint });
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (json.errors) {
      throw new Error(`Shopify GraphQL error: ${json.errors[0]?.message}`);
    }

    return json.data as T;
  }

  async getOrders(startDate: string, endDate: string): Promise<ShopifyOrder[]> {
    const allOrders: ShopifyOrder[] = [];
    let cursor: string | null = null;
    const queryFilter = `created_at:>='${startDate}' AND created_at:<='${endDate}' AND financial_status:paid`;

    do {
      const variables: Record<string, unknown> = { query: queryFilter };
      if (cursor) variables.cursor = cursor;

      const data = await this.query<ShopifyOrdersConnection>(ORDERS_QUERY, variables);
      const edges = data.orders.edges;

      for (const edge of edges) {
        allOrders.push(edge.node);
      }

      if (data.orders.pageInfo.hasNextPage && edges.length > 0) {
        cursor = edges[edges.length - 1].cursor;
      } else {
        cursor = null;
      }
    } while (cursor);

    return allOrders;
  }

  async getOrdersAggregate(startDate: string, endDate: string): Promise<OrdersAggregate> {
    const orders = await this.getOrders(startDate, endDate);

    let totalRevenue = 0;
    let currency = "USD";
    const dailyMap = new Map<string, DailyRevenue>();

    for (const order of orders) {
      const amount = parseFloat(order.currentTotalPriceSet.shopMoney.amount);
      currency = order.currentTotalPriceSet.shopMoney.currencyCode;
      totalRevenue += amount;

      const date = order.createdAt.split("T")[0];
      const existing = dailyMap.get(date) || { date, revenue: 0, orders: 0 };
      existing.revenue += amount;
      existing.orders += 1;
      dailyMap.set(date, existing);
    }

    const dailyRevenue = Array.from(dailyMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    return {
      totalRevenue,
      orderCount: orders.length,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      currency,
      dailyRevenue,
    };
  }

  async getTopProducts(startDate: string, endDate: string, limit = 10): Promise<TopProduct[]> {
    const orders = await this.getOrders(startDate, endDate);
    const productMap = new Map<string, TopProduct>();

    for (const order of orders) {
      const orderProducts = new Set<string>();
      for (const edge of order.lineItems.edges) {
        const item = edge.node;
        const existing = productMap.get(item.title) || {
          title: item.title,
          totalRevenue: 0,
          totalQuantitySold: 0,
          orderCount: 0,
        };
        existing.totalRevenue += parseFloat(item.originalTotalSet.shopMoney.amount);
        existing.totalQuantitySold += item.quantity;
        orderProducts.add(item.title);
        productMap.set(item.title, existing);
      }
      for (const title of orderProducts) {
        const product = productMap.get(title)!;
        product.orderCount += 1;
      }
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.query<{ shop: { name: string } }>(`{ shop { name } }`);
      return true;
    } catch {
      return false;
    }
  }
}

export const shopifyClient = new ShopifyClient();
