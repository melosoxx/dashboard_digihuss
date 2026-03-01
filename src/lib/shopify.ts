import "server-only";
import type {
  ShopifyOrdersConnection,
  ShopifyOrder,
  OrdersAggregate,
  DailyRevenue,
  TopProduct,
  OrderListItem,
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
          customer {
            displayName
            email
          }
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

export interface ShopifyClientCreds {
  domain: string;
  version: string;
  token: string;
}

class ShopifyClient {
  private endpoint: string;
  private accessToken: string;

  constructor(creds?: ShopifyClientCreds) {
    const domain = creds?.domain || process.env.SHOPIFY_STORE_DOMAIN;
    const version = creds?.version || process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";
    const token = creds?.token || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    if (!domain || !token) {
      throw new Error("Missing Shopify credentials");
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

  async getOrdersList(startDate: string, endDate: string): Promise<OrderListItem[]> {
    const orders = await this.getOrders(startDate, endDate);
    return orders
      .map((o) => ({
        name: o.name,
        createdAt: o.createdAt,
        customerName: o.customer?.displayName ?? "Sin nombre",
        customerEmail: o.customer?.email ?? "",
        total: parseFloat(o.currentTotalPriceSet.shopMoney.amount),
        currency: o.currentTotalPriceSet.shopMoney.currencyCode,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  async getSessions(startDate: string, endDate: string): Promise<number> {
    try {
      const shopifyql = `FROM sessions SHOW sessions SINCE ${startDate} UNTIL ${endDate}`;

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": this.accessToken,
        },
        body: JSON.stringify({
          query: `query GetSessions($query: String!) {
            shopifyqlQuery(query: $query) {
              ... on ShopifyqlQueryResponse {
                tableData { columns { name dataType } rows }
                parseErrors
              }
            }
          }`,
          variables: { query: shopifyql },
        }),
      });

      const json = await response.json();

      if (json.errors) {
        console.error("ShopifyQL errors:", json.errors);
        return 0;
      }

      const result = json.data?.shopifyqlQuery;
      if (result?.parseErrors?.length > 0) {
        console.error("ShopifyQL parse errors:", result.parseErrors);
        return 0;
      }

      const table = result?.tableData;
      if (table?.rows?.length > 0) {
        const row = table.rows[0];
        // Rows are objects like { "sessions": "272" }
        const val = typeof row === "object" && row !== null
          ? Object.values(row)[0]
          : row;
        return parseInt(String(val), 10) || 0;
      }
      return 0;
    } catch (error) {
      console.error("Shopify sessions query error:", error);
      return 0;
    }
  }

  async getCheckouts(startDate: string, endDate: string, orderCount: number): Promise<number> {
    try {
      const ABANDONED_QUERY = `
        query GetAbandoned($query: String!, $cursor: String) {
          abandonedCheckouts(first: 250, after: $cursor, query: $query) {
            edges { node { id } cursor }
            pageInfo { hasNextPage }
          }
        }
      `;
      const queryFilter = `created_at:>='${startDate}' AND created_at:<='${endDate}'`;
      let total = 0;
      let cursor: string | null = null;

      do {
        const variables: Record<string, unknown> = { query: queryFilter };
        if (cursor) variables.cursor = cursor;

        const data = await this.query<{
          abandonedCheckouts: {
            edges: Array<{ node: { id: string }; cursor: string }>;
            pageInfo: { hasNextPage: boolean };
          };
        }>(ABANDONED_QUERY, variables);

        total += data.abandonedCheckouts.edges.length;

        if (data.abandonedCheckouts.pageInfo.hasNextPage && data.abandonedCheckouts.edges.length > 0) {
          cursor = data.abandonedCheckouts.edges[data.abandonedCheckouts.edges.length - 1].cursor;
        } else {
          cursor = null;
        }
      } while (cursor);

      // Total checkouts initiated = abandoned + completed (orders)
      return total + orderCount;
    } catch (error) {
      console.error("Shopify checkouts query error:", error);
      return 0;
    }
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

export function createShopifyClient(creds: ShopifyClientCreds): ShopifyClient {
  return new ShopifyClient(creds);
}

export const shopifyClient = new ShopifyClient();
