"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDateRange } from "@/providers/date-range-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME } from "@/lib/constants";
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from "@/types/finance";

export function useFinanceExpenses() {
  const { dateRange } = useDateRange();
  const { activeProfileId } = useBusinessProfile();
  const queryClient = useQueryClient();

  const query = useQuery<{ expenses: Expense[] }>({
    queryKey: [
      "finance",
      "expenses",
      dateRange.startDate,
      dateRange.endDate,
      activeProfileId,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        profileId: activeProfileId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const res = await fetch(`/api/finance/expenses?${params}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: UpdateExpenseInput & { id: string }) => {
      const res = await fetch(`/api/finance/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/expenses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete expense");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  return {
    expenses: query.data?.expenses ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createExpense: createMutation.mutateAsync,
    updateExpense: updateMutation.mutateAsync,
    deleteExpense: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
