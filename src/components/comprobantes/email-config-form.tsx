"use client";

import { useState, useEffect, useCallback } from "react";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useEmailConfig, useSaveEmailConfig } from "@/hooks/use-email-config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CredentialField } from "@/components/settings/credential-field";
import { Save, Loader2 } from "lucide-react";

export function EmailConfigForm() {
  const { activeProfileId } = useBusinessProfile();
  const { data, isLoading } = useEmailConfig();
  const saveConfig = useSaveEmailConfig();

  const [enabled, setEnabled] = useState(false);
  const [credError, setCredError] = useState("");
  const [gmailAddress, setGmailAddress] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [senderName, setSenderName] = useState("");
  const [subjectTemplate, setSubjectTemplate] = useState("Tu descarga esta lista!");
  const [footerText, setFooterText] = useState("Gracias por tu compra!");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);

  // Sync form state only when a different config loads (initial load or profile switch)
  // Using config id + activeProfileId avoids re-syncing on background refetches
  // which would overwrite the user's pending edits
  const configId = data?.config?.id;
  useEffect(() => {
    if (!data?.config) return;
    setEnabled(data.config.enabled);
    setGmailAddress(data.config.gmailAddress);
    setSenderName(data.config.senderName);
    setSubjectTemplate(data.config.subjectTemplate);
    setFooterText(data.config.footerText);
    setDownloadUrl(data.config.downloadUrl ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configId, activeProfileId]);

  const handleSaveCredentials = useCallback(async () => {
    if (!activeProfileId || !appPassword.trim()) return;
    setSavingCreds(true);
    setCredError("");
    try {
      const res = await fetch(`/api/profiles/${activeProfileId}/credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "email",
          credentials: { appPassword },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar credenciales.");
      }
      setAppPassword("");
      setCredError("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setCredError(msg);
      console.error(err);
    } finally {
      setSavingCreds(false);
    }
  }, [activeProfileId, appPassword]);

  const handleSaveConfig = useCallback(async () => {
    if (!activeProfileId) return;

    await saveConfig.mutateAsync({
      profileId: activeProfileId,
      enabled,
      gmailAddress,
      senderName,
      subjectTemplate,
      footerText,
      downloadUrl,
    });
  }, [activeProfileId, enabled, gmailAddress, senderName, subjectTemplate, footerText, downloadUrl, saveConfig]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
        <div className="space-y-0.5">
          <Label htmlFor="email-enabled-switch">Habilitar envio de comprobantes</Label>
          <p className="text-xs text-muted-foreground">
            Activa para poder enviar links de descarga a los clientes desde la tabla de pedidos
          </p>
        </div>
        <Switch
          id="email-enabled-switch"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      {/* Gmail credentials */}
      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Credenciales de Gmail</Label>
          <p className="text-xs text-muted-foreground">
            Configura tu Gmail y App Password para enviar emails. Necesitas habilitar
            la verificacion en 2 pasos y crear una contrasena de aplicacion en{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              myaccount.google.com/apppasswords
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label>Direccion Gmail</Label>
          <Input
            value={gmailAddress}
            onChange={(e) => setGmailAddress(e.target.value)}
            placeholder="minegocio@gmail.com"
            type="email"
          />
        </div>

        <CredentialField
          label="App Password"
          value={appPassword}
          onChange={setAppPassword}
          placeholder="xxxx xxxx xxxx xxxx"
          isSecret
          helpText="Contrasena de aplicacion de Google (16 caracteres, sin espacios)"
        />

        <Button
          onClick={handleSaveCredentials}
          disabled={savingCreds || !appPassword.trim()}
          size="sm"
        >
          {savingCreds ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar credenciales
        </Button>

        {credError && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            {credError}
          </p>
        )}
      </div>

      {/* Email settings */}
      <div className="space-y-4 pt-2 border-t border-border/30">
        <Label className="text-sm font-medium">Configuracion del email</Label>

        <div className="space-y-2">
          <Label>Nombre del remitente</Label>
          <Input
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Ej: Tienda Digital"
          />
          <p className="text-xs text-muted-foreground">
            El nombre que aparece como remitente del email
          </p>
        </div>

        <div className="space-y-2">
          <Label>Asunto del email</Label>
          <Input
            value={subjectTemplate}
            onChange={(e) => setSubjectTemplate(e.target.value)}
            placeholder="Tu descarga esta lista!"
          />
        </div>

        <div className="space-y-2">
          <Label>Texto del footer</Label>
          <Input
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="Gracias por tu compra!"
          />
        </div>
      </div>

      {/* Download link */}
      <div className="space-y-4 pt-2 border-t border-border/30">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Link de descarga</Label>
          <p className="text-xs text-muted-foreground">
            El link de Google Drive que se envia al cliente cuando haces click en &quot;Enviar&quot; en la tabla de pedidos.
          </p>
        </div>

        <div className="space-y-2">
          <Input
            value={downloadUrl}
            onChange={(e) => setDownloadUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </div>
      </div>

      {/* Save all */}
      <div className="pt-2 border-t border-border/30">
        <Button
          onClick={handleSaveConfig}
          disabled={saveConfig.isPending}
        >
          {saveConfig.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar configuracion
        </Button>

        {saveConfig.isSuccess && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            Configuracion guardada exitosamente
          </p>
        )}

        {saveConfig.isError && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            {saveConfig.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
