"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Wifi } from "lucide-react";
import type { ServiceCredentials } from "@/types/business";

interface ConnectionTesterProps {
  credentials: ServiceCredentials;
  service: "shopify" | "meta" | "clarity";
}

function buildTestHeaders(credentials: ServiceCredentials): Record<string, string> {
  const headers: Record<string, string> = {};

  if (credentials.shopify) {
    headers["X-Shopify-Domain"] = credentials.shopify.storeDomain;
    headers["X-Shopify-Api-Version"] = credentials.shopify.adminApiVersion;
    headers["X-Shopify-Token"] = credentials.shopify.adminAccessToken;
  }

  if (credentials.meta) {
    headers["X-Meta-Account-Id"] = credentials.meta.adAccountId;
    headers["X-Meta-Token"] = credentials.meta.accessToken;
    headers["X-Meta-Api-Version"] = credentials.meta.apiVersion;
  }

  if (credentials.clarity) {
    headers["X-Clarity-Project-Id"] = credentials.clarity.projectId;
    headers["X-Clarity-Token"] = credentials.clarity.apiToken;
  }

  return headers;
}

export function ConnectionTester({ credentials, service }: ConnectionTesterProps) {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const handleTest = async () => {
    setStatus("testing");
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: buildTestHeaders(credentials),
      });
      const data = await res.json();
      setStatus(data[service] ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={status === "testing"}
      >
        {status === "testing" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wifi className="mr-2 h-4 w-4" />
        )}
        Probar conexion
      </Button>
      {status === "success" && (
        <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Conectado
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <XCircle className="h-4 w-4" />
          Error de conexion
        </span>
      )}
    </div>
  );
}
