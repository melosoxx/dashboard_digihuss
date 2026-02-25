"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Wifi } from "lucide-react";

export interface MetaAccountInfo {
  accountName?: string;
  businessName?: string;
  accountId?: string;
}

interface ConnectionTesterProps {
  profileId: string | null;
  service: "shopify" | "meta" | "clarity";
  onMetaAccountInfo?: (info: MetaAccountInfo) => void;
}

export function ConnectionTester({ profileId, service, onMetaAccountInfo }: ConnectionTesterProps) {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const queryClient = useQueryClient();

  const handleTest = async () => {
    if (!profileId) return;
    setStatus("testing");
    setErrorMessage("");
    try {
      const params = new URLSearchParams({ profileId, service });
      const res = await fetch(`/api/test-connection?${params}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data[service]) {
        setStatus("success");
        if (service === "meta" && data.metaAccountInfo && onMetaAccountInfo) {
          onMetaAccountInfo(data.metaAccountInfo);
        }
      } else {
        setStatus("error");
        setErrorMessage(data.error || "No se pudo conectar al servicio");
      }

      // CRITICAL: Invalidate profiles query to refetch validation status
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={status === "testing" || !profileId}
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
      {status === "error" && errorMessage && (
        <p className="text-xs text-red-600 dark:text-red-400 max-w-md">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
