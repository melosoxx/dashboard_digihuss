"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BulkExpenseInput, BulkImportResult } from "@/types/finance";

export function useBulkImport() {
  const queryClient = useQueryClient();

  const mutation = useMutation<BulkImportResult, Error, BulkExpenseInput[]>({
    mutationFn: async (expenses) => {
      const res = await fetch("/api/finance/expenses/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenses }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to import expenses");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  return {
    importExpenses: mutation.mutateAsync,
    isImporting: mutation.isPending,
    importError: mutation.error,
  };
}
