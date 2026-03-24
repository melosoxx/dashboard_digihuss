import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AIConversation } from "@/types/ai";

const CONVERSATIONS_KEY = ["ai-conversations"];

export function useAIConversations() {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery<AIConversation[]>({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => {
      const res = await fetch("/api/ai/conversations");
      if (!res.ok) throw new Error("Error cargando conversaciones");
      return res.json();
    },
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async (title: string | undefined) => {
      const res = await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Error creando conversación");
      return res.json() as Promise<AIConversation>;
    },
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_KEY });
      const previous = queryClient.getQueryData<AIConversation[]>(CONVERSATIONS_KEY);
      const optimistic: AIConversation = {
        id: `temp-${Date.now()}`,
        user_id: "",
        title: title || "Nueva conversación",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueryData<AIConversation[]>(CONVERSATIONS_KEY, (old = []) => [optimistic, ...old]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CONVERSATIONS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetch(`/api/ai/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Error renombrando conversación");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/ai/conversations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error eliminando conversación");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_KEY });
      const previous = queryClient.getQueryData<AIConversation[]>(CONVERSATIONS_KEY);
      queryClient.setQueryData<AIConversation[]>(CONVERSATIONS_KEY, (old = []) => old.filter((c) => c.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CONVERSATIONS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });

  return {
    conversations,
    isLoading,
    createConversation: createMutation.mutateAsync,
    renameConversation: renameMutation.mutateAsync,
    deleteConversation: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

// Hook to load messages for a specific conversation
export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["ai-conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      const res = await fetch(`/api/ai/conversations/${conversationId}`);
      if (!res.ok) throw new Error("Error cargando mensajes");
      return res.json();
    },
    enabled: !!conversationId,
    staleTime: 10_000,
  });
}
