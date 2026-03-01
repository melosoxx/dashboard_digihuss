"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { QUERY_STALE_TIME } from "@/lib/constants";
import type { ExpenseCategory } from "@/types/finance";

export function useFinanceCategories() {
  const { activeProfileId } = useBusinessProfile();
  const queryClient = useQueryClient();

  const query = useQuery<{ categories: ExpenseCategory[] }>({
    queryKey: ["finance", "categories", activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams({ profileId: activeProfileId });
      const res = await fetch(`/api/finance/categories?${params}`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    staleTime: QUERY_STALE_TIME,
  });

  const createMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      type: "fixed" | "variable";
      icon?: string;
      color?: string;
    }) => {
      const res = await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, profileId: activeProfileId }),
      });
      if (!res.ok) throw new Error("Failed to create category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance", "categories"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      color?: string;
      icon?: string | null;
    }) => {
      const res = await fetch(`/api/finance/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/finance/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });

  return {
    categories: query.data?.categories ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
