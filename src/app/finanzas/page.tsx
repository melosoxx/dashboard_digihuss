"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIAssistantBar } from "@/components/panel/ai-assistant-bar";
import { FinanceKPICards } from "@/components/finance/finance-kpi-cards";
import { ExpenseBreakdownChart } from "@/components/finance/expense-breakdown-chart";
import { RevenueExpensesChart } from "@/components/finance/revenue-expenses-chart";
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
import type { Expense } from "@/types/finance";

export default function FinanzasPage() {
  const { profiles, activeProfileId, aggregateMode } = useBusinessProfile();
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

  return (
    <div className="h-full flex flex-col gap-1">
      <PageHeader
        title="Finanzas"
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

      <AIAssistantBar placeholder="Preguntale algo a tus finanzas..." />

      <Tabs defaultValue="resumen" className="flex-1 flex flex-col min-h-0">
        <TabsList
          variant="default"
          className="flex-shrink-0 w-full h-9"
        >
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="mercadopago">MercadoPago</TabsTrigger>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
        </TabsList>

        {/* ── Tab: Resumen ──────────────────────────────────────────────── */}
        <TabsContent
          value="resumen"
          className="flex-1 min-h-0 overflow-hidden mt-2 animate-in fade-in-0 duration-200"
        >
          <div className="h-full flex flex-col gap-2 overflow-hidden">
            {/* KPIs row */}
            <div className="flex-shrink-0">
              <FinanceKPICards data={summary.data} isLoading={summary.isLoading} />
            </div>
            {/* Charts side by side */}
            <div className="flex-1 min-h-0 grid gap-3 grid-cols-1 lg:grid-cols-[1.5fr_1fr] overflow-hidden">
              <div className="min-h-0 overflow-hidden">
                <RevenueExpensesChart
                  data={summary.data?.dailyFinance ?? []}
                  isLoading={summary.isLoading}
                />
              </div>
              <div className="min-h-0 overflow-hidden">
                <ExpenseBreakdownChart
                  data={summary.data?.expensesByCategory ?? []}
                  isLoading={summary.isLoading}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: MercadoPago ─────────────────────────────────────────── */}
        <TabsContent
          value="mercadopago"
          className="flex-1 min-h-0 overflow-hidden mt-2 flex flex-col animate-in fade-in-0 duration-200"
        >
          <Tabs defaultValue="comisiones" className="flex-1 flex flex-col min-h-0">
            <TabsList
              variant="line"
              className="flex-shrink-0 w-full h-8 border-b border-border/20 rounded-none bg-transparent gap-0"
            >
              <TabsTrigger value="comisiones" className="text-xs flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Comisiones</TabsTrigger>
              <TabsTrigger value="transacciones" className="text-xs flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Transacciones</TabsTrigger>
            </TabsList>

            <TabsContent value="comisiones" className="flex-1 min-h-0 overflow-y-auto pt-2 animate-in fade-in-0 duration-150">
              <MpFeesCard
                data={summary.data?.mpSummary}
                isLoading={summary.isLoading}
                serviceStatus={summary.data?.serviceStatus?.mercadopago}
              />
            </TabsContent>

            <TabsContent value="transacciones" className="flex-1 min-h-0 overflow-hidden pt-2 animate-in fade-in-0 duration-150">
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

        {/* ── Tab: Gastos ──────────────────────────────────────────────── */}
        <TabsContent
          value="gastos"
          className="flex-1 min-h-0 overflow-hidden mt-2 flex flex-col animate-in fade-in-0 duration-200"
        >
          <Tabs defaultValue="fijos" className="flex-1 flex flex-col min-h-0">
            <TabsList
              variant="line"
              className="flex-shrink-0 w-full h-8 border-b border-border/20 rounded-none bg-transparent gap-0"
            >
              <TabsTrigger value="fijos" className="text-xs flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Fijos Mensuales</TabsTrigger>
              <TabsTrigger value="detalle" className="text-xs flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground/60 hover:text-muted-foreground">Detalle de Egresos</TabsTrigger>
            </TabsList>

            <TabsContent value="fijos" className="flex-1 min-h-0 overflow-y-auto pt-2 animate-in fade-in-0 duration-150">
              <RecurringExpensesCard
                expenses={expenses.expenses}
                isLoading={expenses.isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="detalle" className="flex-1 min-h-0 overflow-y-auto pt-2 animate-in fade-in-0 duration-150">
              <ExpenseTable
                expenses={expenses.expenses}
                isLoading={expenses.isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
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
