"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Plus,
  DollarSign,
  TrendingDown,
  Wallet,
  Percent,
  Calendar,
  CreditCard,
  Receipt,
  BarChart3,
  ArrowRightLeft,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIAssistantBar } from "@/components/panel/ai-assistant-bar";
import { KPICard } from "@/components/dashboard/kpi-card";
import { RevenueExpensesChart } from "@/components/finance/revenue-expenses-chart";
import { ExpenseBreakdownChart } from "@/components/finance/expense-breakdown-chart";
import { FinanceInsightsStrip } from "@/components/finance/finance-insights-strip";
import { DailyRevenueAreaChart } from "@/components/finance/daily-revenue-area-chart";
import { PaymentTypeBarChart } from "@/components/finance/payment-type-bar-chart";
import { DailyExpensesChart } from "@/components/finance/daily-expenses-chart";
import { ProfitMarginChart } from "@/components/finance/profit-margin-chart";
import { WaterfallChart } from "@/components/finance/waterfall-chart";
import { ProjectionCard } from "@/components/finance/projection-card";
import { MpFeesCard } from "@/components/finance/mp-fees-card";
import { MpTransactionsTable } from "@/components/finance/mp-transactions-table";
import { RecurringExpensesCard } from "@/components/finance/recurring-expenses-card";
import { ExpenseTable } from "@/components/finance/expense-table";
import { ExpenseFormDialog } from "@/components/finance/expense-form-dialog";
import { useFinanceSummary } from "@/hooks/use-finance-summary";
import { useFinanceExpenses } from "@/hooks/use-finance-expenses";
import { useFinanceCategories } from "@/hooks/use-finance-categories";
import { useMpTransactions } from "@/hooks/use-mp-transactions";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useDateRange } from "@/providers/date-range-provider";
import { useCurrency } from "@/providers/currency-provider";
import { buildDashboardContext } from "@/lib/ai-context-builder";
import type { Expense } from "@/types/finance";

export default function FinanzasPage() {
  const { profiles, activeProfileId, aggregateMode, selectedProfileIds } = useBusinessProfile();
  const { dateRange } = useDateRange();
  const { formatMoney } = useCurrency();
  const summary = useFinanceSummary();
  const expenses = useFinanceExpenses();
  const categories = useFinanceCategories();
  const mpTransactions = useMpTransactions();

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txPage, setTxPage] = useState(0);

  const handleOpenCreate = useCallback(() => {
    setEditingExpense(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await expenses.deleteExpense(id);
    },
    [expenses]
  );

  const handleFormSubmit = useCallback(
    async (data: {
      profileId: string;
      categoryId: string;
      description: string;
      amount: number;
      expenseDate: string;
      isRecurring: boolean;
      recurrenceDay?: number;
      isGeneral?: boolean;
      notes?: string;
    }) => {
      setIsSubmitting(true);
      try {
        if (editingExpense) {
          await expenses.updateExpense({ id: editingExpense.id, ...data });
        } else {
          await expenses.createExpense(data);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingExpense, expenses]
  );

  const dayCount = useMemo(() => {
    if (!dateRange?.startDate || !dateRange?.endDate) return 1;
    const start = new Date(dateRange.startDate + "T00:00:00");
    const end = new Date(dateRange.endDate + "T00:00:00");
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  }, [dateRange]);

  const s = summary.data;
  const mpNetRevenue = s?.mpNetRevenue ?? 0;
  const totalExpenses = s?.totalExpenses ?? 0;
  const netProfit = s?.netProfit ?? 0;
  const profitMargin = s?.profitMargin ?? 0;
  const adSpend = s?.adSpend ?? 0;
  const mpFees = s?.mpFees ?? 0;
  const grossRevenue = s?.grossRevenue ?? 0;
  const manualExpenses = s?.manualExpenses ?? 0;
  const recurringExpenses = s?.recurringExpenses ?? 0;
  const otherExpenses = manualExpenses + recurringExpenses;

  const activeProfileName = aggregateMode
    ? profiles.filter((p) => selectedProfileIds.includes(p.id)).map((p) => p.name).join(", ") || "Todos"
    : profiles.find((p) => p.isActive)?.name || "Mi negocio";

  const dashboardContext = useMemo(() => {
    return buildDashboardContext({
      dateRange,
      profileName: activeProfileName,
      aggregateMode,
      finance: s ? {
        grossRevenue: s.grossRevenue,
        netProfit: s.netProfit,
        profitMargin: s.profitMargin,
        adSpend: s.adSpend,
        totalExpenses: s.totalExpenses,
        mpFees: s.mpFees,
      } : null,
    });
  }, [dateRange, activeProfileName, aggregateMode, s]);

  const lineTabClasses = "text-xs flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground";

  return (
    <div className="h-full flex flex-col gap-1">
      <PageHeader
        title="P&L"
        description="Ingresos, egresos y rentabilidad real del negocio"
        actions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Gasto
          </Button>
        }
      />

      {summary.error && (
        <ErrorDisplay message="Error al cargar el resumen financiero. Verifica tus credenciales en Configuracion." />
      )}

      <AIAssistantBar placeholder="Preguntale algo al P&L..." dashboardContext={dashboardContext} />

      <Tabs defaultValue="resumen" className="flex-1 flex flex-col min-h-0">
        <TabsList
          variant="default"
          className="flex-shrink-0 w-full h-9 overflow-x-auto scrollbar-none"
        >
          <TabsTrigger value="resumen" className="flex-none sm:flex-1">Resumen</TabsTrigger>
          <TabsTrigger value="ingresos" className="flex-none sm:flex-1">Ingresos</TabsTrigger>
          <TabsTrigger value="egresos" className="flex-none sm:flex-1">Egresos</TabsTrigger>
          <TabsTrigger value="rentabilidad" className="flex-none sm:flex-1">Rentabilidad</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════
            TAB 1: RESUMEN — KPIs + insights + chart (fills remaining)
        ════════════════════════════════════════════════════════════════ */}
        <TabsContent
          value="resumen"
          className="flex-1 min-h-0 mt-2 animate-in fade-in-0 duration-200"
        >
          <div className="h-full flex flex-col gap-2">
            {/* KPI Row */}
            <div className="flex-shrink-0 grid gap-2 grid-cols-2 md:grid-cols-5">
              <KPICard
                title="Ingresos Netos"
                formattedValue={formatMoney(mpNetRevenue)}
                icon={DollarSign}
                iconClassName="text-emerald-500"
                isLoading={summary.isLoading}
                detailItems={[
                  { label: "Bruto MercadoPago", value: formatMoney(grossRevenue) },
                  { label: "- Comisiones MP", value: formatMoney(mpFees) },
                  { label: "= Neto recibido", value: formatMoney(mpNetRevenue), highlighted: true },
                ]}
              />
              <KPICard
                title="Egresos Totales"
                formattedValue={formatMoney(totalExpenses)}
                icon={TrendingDown}
                iconClassName="text-red-500"
                isLoading={summary.isLoading}
                detailItems={[
                  ...(adSpend > 0 ? [{ label: "Publicidad (Meta Ads)", value: formatMoney(adSpend) }] : []),
                  ...(manualExpenses > 0 ? [{ label: "Gastos Manuales", value: formatMoney(manualExpenses) }] : []),
                  ...(recurringExpenses > 0 ? [{ label: "Gastos Recurrentes", value: formatMoney(recurringExpenses) }] : []),
                  { label: "Total", value: formatMoney(totalExpenses), highlighted: true },
                ]}
              />
              <KPICard
                title="Ganancia Neta"
                formattedValue={formatMoney(netProfit)}
                icon={Wallet}
                iconClassName={netProfit >= 0 ? "text-emerald-500" : "text-red-500"}
                isLoading={summary.isLoading}
                detailItems={[
                  { label: "+ Ingresos Netos", value: formatMoney(mpNetRevenue) },
                  { label: "- Egresos Totales", value: formatMoney(totalExpenses) },
                  { label: "= Ganancia Neta", value: formatMoney(netProfit), highlighted: true },
                ]}
              />
              <KPICard
                title="Margen Neto"
                formattedValue={`${profitMargin.toFixed(1)}%`}
                icon={Percent}
                iconClassName="text-teal-500"
                isLoading={summary.isLoading}
                detailItems={[
                  { label: "Ganancia / Ingresos x 100", value: `${profitMargin.toFixed(1)}%`, highlighted: true },
                ]}
              />
              <KPICard
                title="Ingreso Diario"
                formattedValue={formatMoney(dayCount > 0 ? mpNetRevenue / dayCount : 0)}
                icon={Calendar}
                iconClassName="text-blue-500"
                isLoading={summary.isLoading}
                subtitle={`Promedio de ${dayCount} dias`}
              />
            </div>

            {/* Insights */}
            {!summary.isLoading && s && (
              <div className="flex-shrink-0">
                <FinanceInsightsStrip
                  profitMargin={profitMargin}
                  mpFees={mpFees}
                  grossRevenue={grossRevenue}
                  adSpend={adSpend}
                  totalExpenses={totalExpenses}
                  recurringExpenses={recurringExpenses}
                  mpNetRevenue={mpNetRevenue}
                />
              </div>
            )}

            {/* Chart fills remaining space */}
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0">
                <RevenueExpensesChart
                  data={s?.dailyFinance ?? []}
                  isLoading={summary.isLoading}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            TAB 2: INGRESOS
        ════════════════════════════════════════════════════════════════ */}
        <TabsContent
          value="ingresos"
          className="flex-1 min-h-0 mt-2 flex flex-col animate-in fade-in-0 duration-200"
        >
          <Tabs defaultValue="ing-resumen" className="flex-1 flex flex-col min-h-0">
            <TabsList
              variant="line"
              className="flex-shrink-0 w-full h-8 border-b border-border/20 rounded-none bg-transparent gap-0"
            >
              <TabsTrigger value="ing-resumen" className={lineTabClasses}>Resumen</TabsTrigger>
              <TabsTrigger value="ing-comisiones" className={lineTabClasses}>Comisiones</TabsTrigger>
              <TabsTrigger value="ing-transacciones" className={lineTabClasses}>Transacciones</TabsTrigger>
            </TabsList>

            {/* Ingresos > Resumen: KPIs + charts fill remaining */}
            <TabsContent value="ing-resumen" className="flex-1 min-h-0 pt-2 animate-in fade-in-0 duration-150">
              <div className="h-full flex flex-col gap-2">
                <div className="flex-shrink-0 grid gap-2 grid-cols-2 md:grid-cols-4">
                  <KPICard
                    title="Bruto MP"
                    formattedValue={formatMoney(s?.mpSummary?.grossAmount ?? 0)}
                    icon={DollarSign}
                    iconClassName="text-emerald-500"
                    isLoading={summary.isLoading}
                  />
                  <KPICard
                    title="Comisiones"
                    formattedValue={formatMoney(mpFees)}
                    icon={CreditCard}
                    iconClassName="text-amber-500"
                    isLoading={summary.isLoading}
                    subtitle={`${(s?.mpSummary?.avgFeePercent ?? 0).toFixed(1)}% promedio`}
                  />
                  <KPICard
                    title="Neto Recibido"
                    formattedValue={formatMoney(mpNetRevenue)}
                    icon={Wallet}
                    iconClassName="text-blue-500"
                    isLoading={summary.isLoading}
                  />
                  <KPICard
                    title="Ticket Promedio"
                    formattedValue={formatMoney(
                      (s?.mpSummary?.paymentCount ?? 0) > 0
                        ? (s?.mpSummary?.grossAmount ?? 0) / (s?.mpSummary?.paymentCount ?? 1)
                        : 0
                    )}
                    icon={Receipt}
                    iconClassName="text-violet-500"
                    isLoading={summary.isLoading}
                    subtitle={`${s?.mpSummary?.paymentCount ?? 0} transacciones`}
                  />
                </div>
                <div className="flex-1 min-h-0 relative">
                  <div className="absolute inset-0 grid gap-2 grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
                    <DailyRevenueAreaChart
                      data={s?.mpSummary?.dailyPayments ?? []}
                      isLoading={summary.isLoading}
                    />
                    <PaymentTypeBarChart
                      data={s?.mpSummary?.byPaymentType ?? []}
                      isLoading={summary.isLoading}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Ingresos > Comisiones */}
            <TabsContent value="ing-comisiones" className="flex-1 min-h-0 pt-2 animate-in fade-in-0 duration-150">
              <MpFeesCard
                data={s?.mpSummary}
                isLoading={summary.isLoading}
                serviceStatus={s?.serviceStatus?.mercadopago}
              />
            </TabsContent>

            {/* Ingresos > Transacciones */}
            <TabsContent value="ing-transacciones" className="flex-1 min-h-0 pt-2 animate-in fade-in-0 duration-150">
              <MpTransactionsTable
                transactions={mpTransactions.data ?? []}
                isLoading={mpTransactions.isLoading}
                aggregateMode={aggregateMode}
                page={txPage}
                pageSize={15}
                onPageChange={setTxPage}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            TAB 3: EGRESOS
        ════════════════════════════════════════════════════════════════ */}
        <TabsContent
          value="egresos"
          className="flex-1 min-h-0 mt-2 flex flex-col animate-in fade-in-0 duration-200"
        >
          <Tabs defaultValue="eg-resumen" className="flex-1 flex flex-col min-h-0">
            <TabsList
              variant="line"
              className="flex-shrink-0 w-full h-8 border-b border-border/20 rounded-none bg-transparent gap-0"
            >
              <TabsTrigger value="eg-resumen" className={lineTabClasses}>Resumen</TabsTrigger>
              <TabsTrigger value="eg-recurrentes" className={lineTabClasses}>Recurrentes</TabsTrigger>
              <TabsTrigger value="eg-detalle" className={lineTabClasses}>Detalle</TabsTrigger>
            </TabsList>

            {/* Egresos > Resumen: KPIs + charts fill remaining */}
            <TabsContent value="eg-resumen" className="flex-1 min-h-0 pt-2 animate-in fade-in-0 duration-150">
              <div className="h-full flex flex-col gap-2">
                <div className="flex-shrink-0 grid gap-2 grid-cols-2 md:grid-cols-4">
                  <KPICard
                    title="Egresos Totales"
                    formattedValue={formatMoney(totalExpenses)}
                    icon={TrendingDown}
                    iconClassName="text-red-500"
                    isLoading={summary.isLoading}
                  />
                  <KPICard
                    title="Publicidad"
                    formattedValue={formatMoney(adSpend)}
                    icon={BarChart3}
                    iconClassName="text-red-500"
                    isLoading={summary.isLoading}
                    subtitle={totalExpenses > 0 ? `${((adSpend / totalExpenses) * 100).toFixed(0)}% del total` : undefined}
                  />
                  <KPICard
                    title="Gastos Fijos"
                    formattedValue={formatMoney(recurringExpenses)}
                    icon={Calendar}
                    iconClassName="text-violet-500"
                    isLoading={summary.isLoading}
                    subtitle={totalExpenses > 0 ? `${((recurringExpenses / totalExpenses) * 100).toFixed(0)}% del total` : undefined}
                  />
                  <KPICard
                    title="Gastos Variables"
                    formattedValue={formatMoney(manualExpenses)}
                    icon={Receipt}
                    iconClassName="text-orange-500"
                    isLoading={summary.isLoading}
                    subtitle={totalExpenses > 0 ? `${((manualExpenses / totalExpenses) * 100).toFixed(0)}% del total` : undefined}
                  />
                </div>
                <div className="flex-1 min-h-0 relative">
                  <div className="absolute inset-0 grid gap-2 grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
                    <DailyExpensesChart
                      data={s?.dailyFinance ?? []}
                      isLoading={summary.isLoading}
                    />
                    <ExpenseBreakdownChart
                      data={s?.expensesByCategory ?? []}
                      isLoading={summary.isLoading}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Egresos > Recurrentes: KPIs inline + list fills remaining */}
            <TabsContent value="eg-recurrentes" className="flex-1 min-h-0 pt-2 animate-in fade-in-0 duration-150">
              <div className="h-full flex flex-col gap-2">
                <div className="flex-shrink-0 grid gap-2 grid-cols-2">
                  <KPICard
                    title="Total Mensual Fijo"
                    formattedValue={formatMoney(recurringExpenses)}
                    icon={Calendar}
                    iconClassName="text-violet-500"
                    isLoading={summary.isLoading}
                  />
                  <KPICard
                    title="% del Ingreso"
                    formattedValue={mpNetRevenue > 0 ? `${((recurringExpenses / mpNetRevenue) * 100).toFixed(1)}%` : "—"}
                    icon={Percent}
                    iconClassName={
                      mpNetRevenue > 0 && (recurringExpenses / mpNetRevenue) > 0.4
                        ? "text-red-500"
                        : "text-emerald-500"
                    }
                    isLoading={summary.isLoading}
                  />
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <RecurringExpensesCard
                    expenses={expenses.expenses}
                    isLoading={expenses.isLoading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Egresos > Detalle: table fills all space */}
            <TabsContent value="eg-detalle" className="flex-1 min-h-0 pt-2 animate-in fade-in-0 duration-150">
              <div className="h-full overflow-y-auto">
                <ExpenseTable
                  expenses={expenses.expenses}
                  isLoading={expenses.isLoading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            TAB 4: RENTABILIDAD
        ════════════════════════════════════════════════════════════════ */}
        <TabsContent
          value="rentabilidad"
          className="flex-1 min-h-0 mt-2 flex flex-col animate-in fade-in-0 duration-200"
        >
          <Tabs defaultValue="rent-analisis" className="flex-1 flex flex-col min-h-0">
            <TabsList
              variant="line"
              className="flex-shrink-0 w-full h-8 border-b border-border/20 rounded-none bg-transparent gap-0"
            >
              <TabsTrigger value="rent-analisis" className={lineTabClasses}>Analisis</TabsTrigger>
              <TabsTrigger value="rent-proyeccion" className={lineTabClasses}>Proyeccion</TabsTrigger>
            </TabsList>

            {/* Rentabilidad > Analisis: KPIs + 2 charts side-by-side */}
            <TabsContent value="rent-analisis" className="flex-1 min-h-0 pt-2 animate-in fade-in-0 duration-150">
              <div className="h-full flex flex-col gap-2">
                <div className="flex-shrink-0 grid gap-2 grid-cols-2 md:grid-cols-4">
                  <KPICard
                    title="Margen Neto"
                    formattedValue={`${profitMargin.toFixed(1)}%`}
                    icon={Percent}
                    iconClassName={
                      profitMargin >= 20 ? "text-emerald-500"
                      : profitMargin >= 10 ? "text-amber-500"
                      : "text-red-500"
                    }
                    isLoading={summary.isLoading}
                  />
                  <KPICard
                    title="Ratio Ing/Egr"
                    formattedValue={totalExpenses > 0 ? `${(mpNetRevenue / totalExpenses).toFixed(1)}x` : "—"}
                    icon={ArrowRightLeft}
                    iconClassName={
                      totalExpenses > 0 && mpNetRevenue / totalExpenses >= 2
                        ? "text-emerald-500"
                        : "text-amber-500"
                    }
                    isLoading={summary.isLoading}
                    subtitle={totalExpenses > 0 && mpNetRevenue / totalExpenses >= 2 ? "Saludable" : "Ajustado"}
                  />
                  <KPICard
                    title="Burn Rate Diario"
                    formattedValue={formatMoney(dayCount > 0 ? totalExpenses / dayCount : 0)}
                    icon={TrendingDown}
                    iconClassName="text-red-500"
                    isLoading={summary.isLoading}
                    subtitle="Gasto promedio / dia"
                  />
                  <KPICard
                    title="Ganancia Acumulada"
                    formattedValue={formatMoney(netProfit)}
                    icon={Wallet}
                    iconClassName={netProfit >= 0 ? "text-emerald-500" : "text-red-500"}
                    isLoading={summary.isLoading}
                    subtitle={`En ${dayCount} dias`}
                  />
                </div>
                {/* Both charts side by side filling remaining space */}
                <div className="flex-1 min-h-0 relative">
                  <div className="absolute inset-0 grid gap-2 grid-cols-1 lg:grid-cols-2">
                    <ProfitMarginChart
                      data={s?.dailyFinance ?? []}
                      isLoading={summary.isLoading}
                    />
                    <WaterfallChart
                      grossRevenue={grossRevenue}
                      mpFees={mpFees}
                      mpNetRevenue={mpNetRevenue}
                      adSpend={adSpend}
                      otherExpenses={otherExpenses}
                      netProfit={netProfit}
                      isLoading={summary.isLoading}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Rentabilidad > Proyeccion: fills viewport */}
            <TabsContent value="rent-proyeccion" className="flex-1 min-h-0 pt-2 animate-in fade-in-0 duration-150">
              <div className="h-full">
                <ProjectionCard
                  mpNetRevenue={mpNetRevenue}
                  totalExpenses={totalExpenses}
                  netProfit={netProfit}
                  profitMargin={profitMargin}
                  dayCount={dayCount}
                  isLoading={summary.isLoading}
                />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Form dialog */}
      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories.categories}
        profiles={profiles}
        defaultProfileId={activeProfileId}
        editingExpense={editingExpense}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        onCreateCategory={categories.createCategory}
        onUpdateCategory={categories.updateCategory}
        onDeleteCategory={categories.deleteCategory}
      />
    </div>
  );
}
