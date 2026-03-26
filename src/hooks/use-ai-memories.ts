import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AIMemory, AIMemoryCategory } from "@/types/ai";

const MEMORIES_KEY = ["ai-memories"];

export function useAIMemories() {
  const queryClient = useQueryClient();

  const { data: memories = [], isLoading } = useQuery<AIMemory[]>({
    queryKey: MEMORIES_KEY,
    queryFn: async () => {
      const res = await fetch("/api/ai/memories");
      if (!res.ok) throw new Error("Error cargando memorias");
      return res.json();
    },
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async (memory: { title: string; content: string; category: AIMemoryCategory }) => {
      const res = await fetch("/api/ai/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memory),
      });
      if (!res.ok) throw new Error("Error creando memoria");
      return res.json() as Promise<AIMemory>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMORIES_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; content?: string; category?: AIMemoryCategory }) => {
      const res = await fetch(`/api/ai/memories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error actualizando memoria");
      return res.json() as Promise<AIMemory>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMORIES_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ai/memories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error eliminando memoria");
    },
    // Optimistic delete — remove immediately, restore on error
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: MEMORIES_KEY });
      const previous = queryClient.getQueryData<AIMemory[]>(MEMORIES_KEY);
      queryClient.setQueryData<AIMemory[]>(MEMORIES_KEY, (old = []) =>
        old.filter((m) => m.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(MEMORIES_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MEMORIES_KEY });
    },
  });

  return {
    memories,
    isLoading,
    createMemory: createMutation.mutateAsync,
    updateMemory: updateMutation.mutateAsync,
    deleteMemory: deleteMutation.mutateAsync,
  };
}
