"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBusinessProfile } from "@/providers/business-profile-provider";

interface QuotaResponse {
  remaining: number;
  used: number;
  max: number;
  exhausted: boolean;
  lastFetchAt: string | null;
}

export function useClarityQuota() {
  const { activeProfileId } = useBusinessProfile();
  const queryClient = useQueryClient();

  const { data } = useQuery<QuotaResponse>({
    queryKey: ["clarity", "quota", activeProfileId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeProfileId) params.set("profileId", activeProfileId);
      const res = await fetch(`/api/clarity/quota?${params}`);
      if (!res.ok) throw new Error("Failed to fetch quota");
      return res.json();
    },
    enabled: !!activeProfileId,
    staleTime: 10_000,
  });

  const remaining = data?.remaining ?? 10;
  const used = data?.used ?? 0;
  const max = data?.max ?? 10;
  const exhausted = data?.exhausted ?? false;
  const lastFetchAt = data?.lastFetchAt ?? null;

  const invalidateQuota = () => {
    queryClient.invalidateQueries({ queryKey: ["clarity", "quota", activeProfileId] });
  };

  return { remaining, used, max, exhausted, lastFetchAt, invalidateQuota };
}
