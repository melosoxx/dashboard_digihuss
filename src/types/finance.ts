// --- MercadoPago API response types ---

export interface MercadoPagoPayment {
  id: number;
  status: string;
  date_created: string;
  date_approved: string | null;
  transaction_amount: number;
  currency_id: string;
  payment_method_id: string;
  payment_type_id: string;
  installments: number;
  description: string | null;
  collector_id?: number;
  transaction_details: {
    net_received_amount: number;
    total_paid_amount: number;
    installment_amount: number;
  };
  fee_details: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
}

export interface MercadoPagoSearchResponse {
  paging: { total: number; limit: number; offset: number };
  results: MercadoPagoPayment[];
}

// --- MercadoPago aggregated data ---

export interface MercadoPagoSummary {
  accountId: number;
  grossAmount: number;
  netAmount: number;
  totalFees: number;
  feesByType: Array<{ type: string; amount: number }>;
  paymentCount: number;
  avgFeePercent: number;
  byPaymentType: Array<{
    type: string;
    label: string;
    count: number;
    gross: number;
    net: number;
    fees: number;
  }>;
  dailyPayments: Array<{
    date: string;
    gross: number;
    net: number;
    fees: number;
  }>;
}

// --- MercadoPago transaction (individual payment, formatted) ---

export interface MpTransaction {
  id: number;
  date: string;
  description: string | null;
  paymentType: string;
  paymentMethod: string;
  installments: number;
  grossAmount: number;
  fees: number;
  netAmount: number;
  currency: string;
  profileName?: string;
  profileColor?: string;
}

// --- Expense types ---

export interface ExpenseCategory {
  id: string;
  profileId: string | null;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  type: "fixed" | "variable";
  sortOrder: number;
  isSystem: boolean;
}

export interface Expense {
  id: string;
  profileId: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  categoryColor?: string;
  categoryIcon?: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  source: "manual";
  isRecurring: boolean;
  recurrenceDay: number | null;
  isGeneral: boolean;
  splitAmong: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  profileId: string;
  categoryId: string;
  description: string;
  amount: number;
  expenseDate: string;
  isRecurring?: boolean;
  recurrenceDay?: number;
  isGeneral?: boolean;
  notes?: string;
}

export interface UpdateExpenseInput {
  profileId?: string;
  categoryId?: string;
  description?: string;
  amount?: number;
  expenseDate?: string;
  isRecurring?: boolean;
  recurrenceDay?: number | null;
  isGeneral?: boolean;
  notes?: string | null;
}

// --- Bulk import types ---

export interface BulkExpenseInput {
  profileId: string;
  categoryId: string;
  description: string;
  amount: number;
  expenseDate: string;
  notes?: string;
}

export interface BulkImportResult {
  inserted: number;
  errors: Array<{ index: number; error: string }>;
}

// --- Finance summary (combined) ---

export interface FinanceSummary {
  grossRevenue: number;
  mpNetRevenue: number;
  mpFees: number;
  adSpend: number;
  manualExpenses: number;
  recurringExpenses: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;

  mpSummary: MercadoPagoSummary | null;

  expensesByCategory: Array<{
    categoryName: string;
    categoryColor: string;
    total: number;
    percentage: number;
  }>;

  dailyFinance: Array<{
    date: string;
    revenue: number;
    adSpend: number;
    mpFees: number;
    otherExpenses: number;
    netProfit: number;
  }>;

  serviceStatus?: {
    shopify: "ok" | "error";
    meta: "ok" | "error";
    mercadopago: "ok" | "error";
  };
}
