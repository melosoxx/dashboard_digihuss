"use client";

import { useShopifyOrders } from "@/hooks/use-shopify-orders";
import { useMetaAccount } from "@/hooks/use-meta-account";
import { useClarity } from "@/hooks/use-clarity";
import { IntegrationLogos } from "@/components/panel/integration-logos";

export function IntegrationStatus() {
  const shopify = useShopifyOrders();
  const meta = useMetaAccount();
  const clarity = useClarity();

  return (
    <IntegrationLogos
      shopifyStatus={shopify.isLoading ? "loading" : shopify.error ? "error" : "connected"}
      metaStatus={meta.isLoading ? "loading" : meta.error ? "error" : "connected"}
      clarityStatus={
        clarity.isFetching ? "loading"
          : clarity.error ? "error"
          : clarity.data ? "connected"
          : "idle"
      }
    />
  );
}
