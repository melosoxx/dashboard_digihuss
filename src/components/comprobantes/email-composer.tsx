"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, CheckCircle2, X, Mail, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEmailConfig } from "@/hooks/use-email-config";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { renderDownloadEmail } from "@/lib/email/templates/download-template";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { ComposerData } from "@/types/email";

interface EmailComposerProps {
  composerData: ComposerData | null;
  onDiscard?: () => void;
}

export function EmailComposer({ composerData, onDiscard }: EmailComposerProps) {
  const queryClient = useQueryClient();
  const { profiles } = useBusinessProfile();
  const orderProfile = composerData
    ? profiles.find((p) => p.id === composerData.profileId) ?? null
    : null;
  const { data: emailConfigData, isLoading: configLoading } = useEmailConfig(composerData?.profileId);
  const config = emailConfigData?.config;
  const isMobile = useIsMobile();

  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Sync fields when composerData or config changes
  useEffect(() => {
    setToEmail(composerData?.customerEmail ?? "");
    setSentTo(null);
  }, [composerData]);

  useEffect(() => {
    if (config?.subjectTemplate) {
      setSubject(config.subjectTemplate);
    }
  }, [config?.subjectTemplate]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/comprobantes/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: composerData!.profileId,
          customerEmail: toEmail.trim(),
          customerName: composerData!.customerName || "Cliente",
          orderName: composerData!.orderName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      return data;
    },
    onSuccess: () => {
      setSentTo(toEmail.trim());
      queryClient.invalidateQueries({ queryKey: ["email-send-status"] });
    },
  });

  const previewHtml = useMemo(() => {
    if (!orderProfile || !config?.downloadUrl) return "";
    return renderDownloadEmail({
      businessName: orderProfile.name,
      businessColor: orderProfile.color,
      customerName: composerData?.customerName ?? "Cliente",
      downloadUrl: config.downloadUrl,
      footerText: config.footerText ?? "Gracias por tu compra!",
    });
  }, [orderProfile, config, composerData?.customerName]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail.trim());
  const canSend = !!composerData && isValidEmail && !configLoading && !!config?.enabled && !!config?.downloadUrl;

  // Empty state — no order loaded
  if (!composerData) {
    return (
      <Card className="h-full flex flex-col items-center justify-center gap-4 py-12">
        <Mail className="h-10 w-10 text-muted-foreground/30" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            No hay comprobante cargado
          </p>
          <p className="text-xs text-muted-foreground/60">
            Seleccioná un pedido de la tabla para componer un comprobante
          </p>
        </div>
        {onDiscard && (
          <Button variant="outline" size="sm" onClick={onDiscard}>
            Ir a Pedidos Recibidos
          </Button>
        )}
      </Card>
    );
  }

  // Config not enabled
  if (!configLoading && (!config || !config.enabled)) {
    return (
      <Card className="h-full flex flex-col items-center justify-center gap-4 py-12">
        <AlertCircle className="h-10 w-10 text-amber-500/60" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            Comprobantes no configurados
          </p>
          <p className="text-xs text-muted-foreground/60">
            Configurá tus credenciales de email en Configuración &gt; Comprobantes
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${isMobile ? "overflow-y-auto" : "overflow-hidden"}`}>
      <div className={`${isMobile ? "" : "flex-1"} min-h-0 flex ${isMobile ? "flex-col" : "flex-row"}`}>
        {/* Left panel — form fields + footer */}
        <div className={`flex flex-col ${isMobile ? "flex-shrink-0" : "w-[40%] border-r border-border/30"}`}>
          {/* Header fields */}
          <div className="flex-shrink-0 border-b border-border/30">
            {/* From */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border/20">
              <span className="text-xs text-muted-foreground/60 w-12 flex-shrink-0">De</span>
              <span className="text-sm text-muted-foreground">
                {config?.senderName ? `${config.senderName} ` : ""}
                <span className="text-muted-foreground/60">
                  &lt;{config?.gmailAddress ?? "..."}&gt;
                </span>
              </span>
            </div>

            {/* To */}
            <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border/20">
              <label htmlFor="composer-to" className="text-xs text-muted-foreground/60 w-12 flex-shrink-0">
                Para
              </label>
              <Input
                id="composer-to"
                type="email"
                value={toEmail}
                onChange={(e) => {
                  setToEmail(e.target.value);
                  setSentTo(null);
                }}
                placeholder="email@ejemplo.com"
                className="border-0 shadow-none focus-visible:ring-0 px-0 h-8 text-sm"
              />
            </div>

            {/* Subject */}
            <div className="flex items-center gap-3 px-4 py-1.5">
              <label htmlFor="composer-subject" className="text-xs text-muted-foreground/60 w-12 flex-shrink-0">
                Asunto
              </label>
              <Input
                id="composer-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del email"
                className="border-0 shadow-none focus-visible:ring-0 px-0 h-8 text-sm"
              />
            </div>
          </div>

          {/* Spacer pushes footer to bottom on desktop */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-border/30 px-4 py-3 flex flex-col gap-2">
            <div className="text-xs text-muted-foreground/60 truncate">
              Pedido: <span className="font-medium text-muted-foreground">{composerData.orderName}</span>
              {" · "}
              Cliente: <span className="font-medium text-muted-foreground">{composerData.customerName}</span>
            </div>

            <div className="flex items-center gap-2 justify-end flex-wrap">
              {/* Success message */}
              {sentTo && (
                <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 animate-in fade-in-0 duration-300 mr-auto">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Enviado a {sentTo}
                </span>
              )}

              {/* Error message */}
              {mutation.isError && (
                <span className="text-xs text-red-500 truncate max-w-[200px] mr-auto">
                  {mutation.error.message}
                </span>
              )}

              {onDiscard && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDiscard}
                  className="text-xs h-8"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Descartar
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => mutation.mutate()}
                disabled={!canSend || mutation.isPending}
                className="h-8 gap-1.5"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel — email preview */}
        <div className={`${isMobile ? "h-[60vh] flex-shrink-0" : "flex-1"} min-h-0 overflow-hidden p-4`}>
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              sandbox=""
              className="w-full h-full border border-border/30 rounded-lg bg-white"
              title="Vista previa del email"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground/50">
              {configLoading ? "Cargando preview..." : "No hay link de descarga configurado"}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
