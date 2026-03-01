"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorDisplay } from "@/components/shared/error-display";
import { SectionLabel } from "@/components/panel/section-label";
import { Button } from "@/components/ui/button";
import { FinanceKPICards } from "@/components/finance/finance-kpi-cards";
import { ExpenseBreakdownChart } from "@/components/finance/expense-breakdown-chart";
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
    <div>
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

      {/* KPIs */}
      <FinanceKPICards data={summary.data} isLoading={summary.isLoading} />

      {/* Expense breakdown chart */}
      <div className="mb-6">
        <ExpenseBreakdownChart
          data={summary.data?.expensesByCategory ?? []}
          isLoading={summary.isLoading}
        />
      </div>

      {/* MercadoPago fees detail */}
      <div className="mb-6">
        <MpFeesCard
          data={summary.data?.mpSummary}
          isLoading={summary.isLoading}
          serviceStatus={summary.data?.serviceStatus?.mercadopago}
        />
      </div>

      {/* MercadoPago transactions */}
      <SectionLabel title="Transacciones MercadoPago" />
      <div className="mb-6">
        <MpTransactionsTable
          transactions={mpTransactions.data ?? []}
          isLoading={mpTransactions.isLoading}
          aggregateMode={aggregateMode}
        />
      </div>

      {/* Recurring expenses */}
      <SectionLabel title="Gastos Fijos Mensuales" />
      <div className="mb-6">
        <RecurringExpensesCard
          expenses={expenses.expenses}
          isLoading={expenses.isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Expense detail table */}
      <SectionLabel title="Detalle de Egresos" />
      <div className="mb-6">
        <ExpenseTable
          expenses={expenses.expenses}
          isLoading={expenses.isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

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
