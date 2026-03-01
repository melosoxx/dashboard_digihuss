export type ServiceName = "shopify" | "meta" | "clarity" | "mercadopago";

export type ValidationStatus = "untested" | "valid" | "invalid";

export interface ServiceValidation {
  status: ValidationStatus;
  lastValidatedAt?: string;
  lastErrorMessage?: string;
}

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

export interface MercadoPagoCredentials {
  accessToken: string;
}

export interface ServiceCredentials {
  shopify?: ShopifyCredentials;
  meta?: MetaCredentials;
  clarity?: ClarityCredentials;
  mercadopago?: MercadoPagoCredentials;
}

export interface BusinessProfile {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  mpKeywords: string[];
  configuredServices: ServiceName[];
  validationStatus?: {
    shopify?: ServiceValidation;
    meta?: ServiceValidation;
    clarity?: ServiceValidation;
    mercadopago?: ServiceValidation;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionTestResult {
  shopify: "success" | "error" | "untested" | "testing";
  meta: "success" | "error" | "untested" | "testing";
  clarity: "success" | "error" | "untested" | "testing";
  mercadopago: "success" | "error" | "untested" | "testing";
}
