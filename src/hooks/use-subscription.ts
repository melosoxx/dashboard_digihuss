import { useQuery } from "@tanstack/react-query";
import type { Subscription } from "@/types/admin";

interface SubscriptionData {
  subscription: Subscription | null;
  accountStatus: string;
  hasStripeCustomer: boolean;
  onboardingCompleted: boolean;
}

export function useSubscription() {
  return useQuery<SubscriptionData>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/subscription");
      if (!res.ok) throw new Error("Failed to fetch subscription");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
