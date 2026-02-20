export interface ShopifyCredentials {
  storeDomain: string;
  adminApiVersion: string;
  adminAccessToken: string;
}

export interface MetaCredentials {
  adAccountId: string;
  accessToken: string;
  apiVersion: string;
}

export interface ClarityCredentials {
  projectId: string;
  apiToken: string;
}

export interface ServiceCredentials {
  shopify?: ShopifyCredentials;
  meta?: MetaCredentials;
  clarity?: ClarityCredentials;
}

export interface BusinessProfile {
  id: string;
  name: string;
  color: string;
  credentials: ServiceCredentials;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfilesState {
  profiles: BusinessProfile[];
  activeProfileId: string | null;
  aggregateMode: boolean;
  selectedProfileIds: string[];
}

export interface ConnectionTestResult {
  shopify: "success" | "error" | "untested" | "testing";
  meta: "success" | "error" | "untested" | "testing";
  clarity: "success" | "error" | "untested" | "testing";
}
