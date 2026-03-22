import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AIConfigResponse } from "@/types/ai";

async function fetchAIConfig(): Promise<AIConfigResponse> {
  const res = await fetch("/api/ai/config");
  if (!res.ok) throw new Error("Failed to fetch AI config");
  return res.json();
}

export function useAIConfig() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ai-config"],
    queryFn: fetchAIConfig,
    staleTime: 60_000,
  });

  return {
    config: data ?? null,
    isLoading,
    isConfigured: data?.configured ?? false,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ["ai-config"] }),
  };
}
