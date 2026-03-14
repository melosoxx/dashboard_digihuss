"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, CheckCircle2, AlertCircle, Loader2, Mail } from "lucide-react";

interface SendButtonProps {
  profileId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  sendStatus?: {
    status: "sent" | "failed";
    sentAt: string;
    errorMessage?: string;
  };
}

export function SendButton({ profileId, orderName, customerEmail, customerName, sendStatus }: SendButtonProps) {
  const queryClient = useQueryClient();
  const [justSent, setJustSent] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/comprobantes/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          customerEmail,
          customerName: customerName || "Cliente",
          orderName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      return data;
    },
    onSuccess: () => {
      setJustSent(true);
      queryClient.invalidateQueries({ queryKey: ["email-send-status"] });
    },
  });

  // No email available
  if (!customerEmail) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Mail className="h-4 w-4 text-muted-foreground/30" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">Sin email de cliente</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Currently sending
  if (mutation.isPending) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  // Just sent successfully (optimistic)
  if (justSent && !mutation.isError) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">Enviado</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Error from mutation
  if (mutation.isError) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setJustSent(false);
                mutation.mutate();
              }}
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs font-medium text-red-500">Error al enviar</p>
            <p className="text-xs text-muted-foreground mt-1">{mutation.error.message}</p>
            <p className="text-xs mt-1">Click para reintentar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Previously sent (from DB)
  if (sendStatus?.status === "sent") {
    const sentDate = new Date(sendStatus.sentAt).toLocaleString("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    });
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setJustSent(false);
                mutation.mutate();
              }}
            >
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Enviado: {sentDate}</p>
            <p className="text-xs text-muted-foreground mt-1">Click para reenviar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Previously failed (from DB)
  if (sendStatus?.status === "failed") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setJustSent(false);
                mutation.mutate();
              }}
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs text-red-500">{sendStatus.errorMessage || "Error previo"}</p>
            <p className="text-xs text-muted-foreground mt-1">Click para reintentar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default: ready to send
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => mutation.mutate()}
          >
            <Send className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Enviar comprobante</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
