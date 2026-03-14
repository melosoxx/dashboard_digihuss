"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import type { EmailConfig } from "@/types/email";

interface EmailConfigResponse {
  config: EmailConfig | null;
}

export function useEmailConfig() {
  const { activeProfileId } = useBusinessProfile();

  return useQuery<EmailConfigResponse>({
    queryKey: ["email-config", activeProfileId],
    queryFn: async () => {
      const res = await fetch(`/api/comprobantes/config?profileId=${activeProfileId}`);
      if (!res.ok) throw new Error("Error al cargar configuracion de email");
      return res.json();
    },
    enabled: !!activeProfileId,
  });
}

interface SaveEmailConfigParams {
  profileId: string;
  enabled: boolean;
  gmailAddress: string;
  senderName: string;
  subjectTemplate: string;
  footerText: string;
  downloadUrl: string;
}

export function useSaveEmailConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveEmailConfigParams) => {
      const res = await fetch("/api/comprobantes/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar configuracion");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["email-config", variables.profileId] });
    },
  });
}
