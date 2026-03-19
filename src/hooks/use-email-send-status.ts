"use client";

import { useQuery } from "@tanstack/react-query";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { getEnabledProfileIds } from "@/lib/aggregate-utils";
import type { EmailSendStatusMap } from "@/types/email";

export function useEmailSendStatus(orderNames: string[]) {
  const { activeProfileId, aggregateMode, selectedProfileIds, profiles } =
    useBusinessProfile();

  // In aggregate mode, query all enabled profile IDs; otherwise just the active one
  const enabledIds = getEnabledProfileIds(profiles, "shopify", selectedProfileIds);
  const profileIds = aggregateMode ? enabledIds : [activeProfileId];
  const isMultiProfile = aggregateMode && profileIds.length > 1;

  return useQuery<EmailSendStatusMap>({
    queryKey: ["email-send-status", profileIds.join(","), orderNames.join(",")],
    queryFn: async () => {
      if (orderNames.length === 0) return {};
      const params = new URLSearchParams({
        orderNames: orderNames.join(","),
      });
      if (isMultiProfile) {
        params.set("profileIds", profileIds.join(","));
      } else {
        params.set("profileId", profileIds[0]);
      }
      const res = await fetch(`/api/comprobantes/status?${params}`);
      if (!res.ok) return {};
      return res.json();
    },
    enabled: profileIds.length > 0 && orderNames.length > 0,
    staleTime: 30_000,
  });
}
