"use client";

import { useQuery } from "@tanstack/react-query";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import type { EmailSendStatusMap } from "@/types/email";

export function useEmailSendStatus(orderNames: string[]) {
  const { activeProfileId } = useBusinessProfile();

  return useQuery<EmailSendStatusMap>({
    queryKey: ["email-send-status", activeProfileId, orderNames.join(",")],
    queryFn: async () => {
      if (orderNames.length === 0) return {};
      const params = new URLSearchParams({
        profileId: activeProfileId,
        orderNames: orderNames.join(","),
      });
      const res = await fetch(`/api/comprobantes/status?${params}`);
      if (!res.ok) return {};
      return res.json();
    },
    enabled: !!activeProfileId && orderNames.length > 0,
    staleTime: 30_000,
  });
}
