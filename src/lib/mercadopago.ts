import "server-only";
import type {
  MercadoPagoPayment,
  MercadoPagoSearchResponse,
  MercadoPagoSummary,
} from "@/types/finance";

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  credit_card: "Tarjeta de credito",
  debit_card: "Tarjeta de debito",
  prepaid_card: "Tarjeta prepaga",
  account_money: "Dinero en cuenta",
  ticket: "Efectivo",
  bank_transfer: "Transferencia",
  atm: "Cajero automatico",
};

interface MercadoPagoClientConfig {
  accessToken: string;
}

export class MercadoPagoClient {
  private accessToken: string;
  private baseUrl = "https://api.mercadopago.com";
  private cachedUserId: number | null = null;

  constructor(config: MercadoPagoClientConfig) {
    this.accessToken = config.accessToken;
  }

  async getUserId(): Promise<number> {
    if (this.cachedUserId === null) {
      const user = await this.request<{ id: number }>("/users/me");
      this.cachedUserId = user.id;
    }
    return this.cachedUserId;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `MercadoPago API error ${res.status}: ${text.slice(0, 200)}`
      );
    }
    return res.json() as Promise<T>;
  }

  async checkConnection(): Promise<{ connected: boolean; userId?: number; email?: string; nickname?: string }> {
    try {
      const user = await this.request<{ id: number; email?: string; nickname?: string }>(
        "/users/me"
      );
      console.log(
        `[MercadoPago] Token belongs to: id=${user.id}, email=${user.email ?? "N/A"}, nickname=${user.nickname ?? "N/A"}`
      );
      return { connected: true, userId: user.id, email: user.email, nickname: user.nickname };
    } catch {
      return { connected: false };
    }
  }

  async getPayments(
    startDate: string,
    endDate: string
  ): Promise<MercadoPagoPayment[]> {
    const allPayments: MercadoPagoPayment[] = [];
    const limit = 100;
    let offset = 0;

    // Format dates for MP API: yyyy-MM-ddTHH:mm:ss.SSS-HHMM (no colon in offset)
    const beginDate = `${startDate}T00:00:00.000-0300`;
    const endDateFormatted = `${endDate}T23:59:59.999-0300`;

    // Get user ID to filter only received payments (sales), not purchases
    const userId = await this.getUserId();

    while (offset < 10000) {
      // Build URL manually — URLSearchParams encodes ":" as "%3A" which MP API rejects
      const query = [
        `sort=date_created`,
        `criteria=desc`,
        `range=date_created`,
        `begin_date=${beginDate}`,
        `end_date=${endDateFormatted}`,
        `operation_type=regular_payment`,
        `offset=${offset}`,
        `limit=${limit}`,
      ].join("&");

      const data = await this.request<MercadoPagoSearchResponse>(
        `/v1/payments/search?${query}`
      );

      // Filter: only approved payments where we are the collector (sales, not purchases)
      const approved = data.results.filter(
        (p) => p.status === "approved" && p.collector_id === userId
      );

      if (offset === 0) {
        console.log(
          `[MercadoPago] Search ${beginDate} → ${endDateFormatted}: ${data.paging.total} total, ${approved.length}/${data.results.length} approved in first page`
        );
      }

      allPayments.push(...approved);

      if (offset + limit >= data.paging.total || data.results.length < limit) {
        break;
      }
      offset += limit;
    }

    return allPayments;
  }

  async getPaymentsSummary(
    startDate: string,
    endDate: string
  ): Promise<MercadoPagoSummary> {
    const accountId = await this.getUserId();
    const payments = await this.getPayments(startDate, endDate);
    return buildMercadoPagoSummary(accountId, payments);
  }
}

export function createMercadoPagoClient(config: MercadoPagoClientConfig) {
  return new MercadoPagoClient(config);
}

/**
 * Filter payments by keywords matched against the description field.
 * If keywords is empty, returns all payments (backward-compatible).
 * Matching is case-insensitive.
 */
export function filterPaymentsByKeywords(
  payments: MercadoPagoPayment[],
  keywords: string[]
): MercadoPagoPayment[] {
  if (keywords.length === 0) return payments;

  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  return payments.filter((p) => {
    if (!p.description) return false;
    const desc = p.description.toLowerCase();
    return lowerKeywords.some((kw) => desc.includes(kw));
  });
}

/**
 * Build a MercadoPagoSummary from a list of payments.
 * Extracted from MercadoPagoClient.getPaymentsSummary() so it can work
 * on pre-filtered payment arrays.
 */
export function buildMercadoPagoSummary(
  accountId: number,
  payments: MercadoPagoPayment[]
): MercadoPagoSummary {
  let grossAmount = 0;
  let netAmount = 0;
  let totalFees = 0;
  const feesByTypeMap = new Map<string, number>();
  const byPaymentTypeMap = new Map<
    string,
    { count: number; gross: number; net: number; fees: number }
  >();
  const dailyMap = new Map<
    string,
    { gross: number; net: number; fees: number }
  >();

  for (const payment of payments) {
    const gross = payment.transaction_amount;
    const net = payment.transaction_details.net_received_amount;
    const collectorFees = payment.fee_details
      .filter((f) => f.fee_payer === "collector")
      .reduce((sum, f) => sum + f.amount, 0);

    grossAmount += gross;
    netAmount += net;
    totalFees += collectorFees;

    // Fees by type
    for (const fee of payment.fee_details) {
      if (fee.fee_payer === "collector") {
        feesByTypeMap.set(
          fee.type,
          (feesByTypeMap.get(fee.type) ?? 0) + fee.amount
        );
      }
    }

    // By payment type
    const pType = payment.payment_type_id;
    const existing = byPaymentTypeMap.get(pType) ?? {
      count: 0,
      gross: 0,
      net: 0,
      fees: 0,
    };
    existing.count += 1;
    existing.gross += gross;
    existing.net += net;
    existing.fees += collectorFees;
    byPaymentTypeMap.set(pType, existing);

    // Daily
    const date = (payment.date_approved ?? payment.date_created).split("T")[0];
    const day = dailyMap.get(date) ?? { gross: 0, net: 0, fees: 0 };
    day.gross += gross;
    day.net += net;
    day.fees += collectorFees;
    dailyMap.set(date, day);
  }

  return {
    accountId,
    grossAmount,
    netAmount,
    totalFees,
    feesByType: Array.from(feesByTypeMap.entries()).map(([type, amount]) => ({
      type,
      amount,
    })),
    paymentCount: payments.length,
    avgFeePercent: grossAmount > 0 ? (totalFees / grossAmount) * 100 : 0,
    byPaymentType: Array.from(byPaymentTypeMap.entries())
      .map(([type, data]) => ({
        type,
        label: PAYMENT_TYPE_LABELS[type] ?? type,
        ...data,
      }))
      .sort((a, b) => b.gross - a.gross),
    dailyPayments: Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}
