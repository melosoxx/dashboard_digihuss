"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CredentialField } from "./credential-field";
import { ConnectionTester, type MetaAccountInfo } from "./connection-tester";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Save, Trash2, Loader2, CheckCircle2, Shield, AlertCircle, Clock, X, Plus, Mail } from "lucide-react";
import type { ServiceCredentials, ServiceName, ServiceValidation } from "@/types/business";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmailConfigForm } from "@/components/comprobantes/email-config-form";

const PROFILE_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

/** Names considered "default" that should be auto-replaced by the Meta business_name */
function isDefaultName(n: string): boolean {
  if (!n) return true;
  const lower = n.trim().toLowerCase();
  if (lower === "predeterminado") return true;
  if (lower === "nuevo negocio") return true;
  if (lower === "new business") return true;
  if (/^negocio\s+\d+$/i.test(n.trim())) return true;
  return false;
}

function ServiceStatusBadge({
  configured,
  validation
}: {
  configured: boolean;
  validation?: ServiceValidation;
}) {
  // State 1: Not configured
  if (!configured) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        <Shield className="h-3 w-3" />
        Sin configurar
      </div>
    );
  }

  // State 2: Configured but untested
  if (!validation || validation.status === "untested") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 cursor-help">
              <Clock className="h-3 w-3" />
              No validado
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Credenciales guardadas pero no probadas</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // State 3: Valid
  if (validation.status === "valid") {
    const lastValidated = validation.lastValidatedAt
      ? new Date(validation.lastValidatedAt).toLocaleString("es-ES", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "Desconocido";

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-help">
              <CheckCircle2 className="h-3 w-3" />
              Validado
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Última validación: {lastValidated}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // State 4: Invalid
  if (validation.status === "invalid") {
    const lastValidated = validation.lastValidatedAt
      ? new Date(validation.lastValidatedAt).toLocaleString("es-ES", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "Desconocido";

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 cursor-help">
              <AlertCircle className="h-3 w-3" />
              Error de conexión
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs font-medium">Error de validación</p>
            <p className="text-xs text-muted-foreground mt-1">
              Última prueba: {lastValidated}
            </p>
            {validation.lastErrorMessage && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {validation.lastErrorMessage}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}

export function ProfileEditor() {
  const {
    activeProfile,
    activeProfileId,
    updateProfile,
    deleteProfile,
    saveCredentials,
    deleteCredentials,
  } = useBusinessProfile();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [color, setColor] = useState(PROFILE_COLORS[0]);
  const [credentials, setCredentials] = useState<ServiceCredentials>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteServiceOpen, setDeleteServiceOpen] = useState<ServiceName | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingService, setSavingService] = useState<ServiceName | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceName | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [mpKeywords, setMpKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [savingKeywords, setSavingKeywords] = useState(false);

  // Sync form state & load non-secret fields when the active profile changes
  useEffect(() => {
    if (!activeProfile || !activeProfileId) return;

    setName(activeProfile.name);
    setColor(activeProfile.color);
    setIsActive(activeProfile.isActive);
    setMpKeywords(activeProfile.mpKeywords ?? []);
    setNewKeyword("");
    setCredentials({});

    // Load non-secret credential fields from the server
    let cancelled = false;
    const services: ServiceName[] = ["shopify", "meta", "clarity", "mercadopago"];
    services.forEach(async (service) => {
      try {
        const res = await fetch(
          `/api/profiles/${activeProfileId}/credentials?service=${service}`
        );
        if (cancelled || !res.ok) return;
        const { fields } = (await res.json()) as { fields: Record<string, string> };
        if (fields && Object.keys(fields).length > 0) {
          setCredentials((prev) => ({
            ...prev,
            [service]: { ...prev[service], ...fields },
          }));
        }
      } catch {
        // ignore
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId]);

  const updateCreds = useCallback(
    <K extends keyof ServiceCredentials>(
      service: K,
      field: string,
      value: string
    ) => {
      setCredentials((prev) => ({
        ...prev,
        [service]: {
          ...prev[service],
          [field]: value,
        },
      }));
    },
    []
  );

  const handleSaveGeneral = async () => {
    if (!activeProfileId) return;
    setSaving(true);
    try {
      await updateProfile(activeProfileId, { name, color, is_active: isActive });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveServiceCredentials = async (service: ServiceName) => {
    if (!activeProfileId) return;
    const serviceCreds = credentials[service];
    if (!serviceCreds) return;

    // At least one non-empty field required
    const values = Object.values(serviceCreds);
    if (values.length === 0 || values.every((v) => !v || String(v).trim() === "")) return;

    // If service is already configured, token fields can be empty (backend preserves them)
    // If NOT configured, all fields must be filled
    if (!isConfigured(service)) {
      if (values.some((v) => !v || String(v).trim() === "")) return;
    }

    setSavingService(service);
    try {
      await saveCredentials(
        activeProfileId,
        service,
        serviceCreds as unknown as Record<string, string>
      );
      // Reload non-secret fields; clear token fields
      const res = await fetch(
        `/api/profiles/${activeProfileId}/credentials?service=${service}`
      );
      if (res.ok) {
        const { fields } = (await res.json()) as { fields: Record<string, string> };
        setCredentials((prev) => ({ ...prev, [service]: fields }));
      } else {
        setCredentials((prev) => ({ ...prev, [service]: undefined }));
      }

      // Auto-test connection after saving
      try {
        const testRes = await fetch(
          `/api/test-connection?profileId=${activeProfileId}&service=${service}`,
          { method: "POST" }
        );
        if (!testRes.ok) {
          console.warn(`Credentials saved but connection test failed for ${service}`);
        }
        // IMPORTANT: Refetch profiles to get updated validation status
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for DB write
        queryClient.invalidateQueries({ queryKey: ["profiles"] });
      } catch (err) {
        console.warn(`Connection test error for ${service}:`, err);
      }
    } finally {
      setSavingService(null);
    }
  };

  const handleDeleteServiceCredentials = async (service: ServiceName) => {
    if (!activeProfileId) return;
    setDeletingService(service);
    try {
      await deleteCredentials(activeProfileId, service);
      setDeleteServiceOpen(null);
    } finally {
      setDeletingService(null);
    }
  };

  const handleMetaAccountInfo = useCallback(
    async (info: MetaAccountInfo) => {
      const businessName = info.businessName || info.accountName;
      if (!businessName || !activeProfileId) return;
      if (isDefaultName(name)) {
        setName(businessName);
        await updateProfile(activeProfileId, { name: businessName });
      }
    },
    [name, activeProfileId, updateProfile]
  );

  const handleSaveKeywords = async () => {
    if (!activeProfileId) return;
    setSavingKeywords(true);
    try {
      await updateProfile(activeProfileId, { mp_keywords: mpKeywords });
    } finally {
      setSavingKeywords(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    if (mpKeywords.some((k) => k.toLowerCase() === trimmed.toLowerCase())) {
      setNewKeyword("");
      return;
    }
    setMpKeywords((prev) => [...prev, trimmed]);
    setNewKeyword("");
  };

  const isServiceDisabled = (service: ServiceName) =>
    activeProfile?.disabledServices?.includes(service) ?? false;

  const handleToggleService = async (service: ServiceName, enabled: boolean) => {
    if (!activeProfileId || !activeProfile) return;
    const current = activeProfile.disabledServices ?? [];
    const updated = enabled
      ? current.filter((s) => s !== service)
      : [...current, service];
    await updateProfile(activeProfileId, { disabled_services: updated });
  };

  const handleDelete = async () => {
    if (!activeProfileId) return;
    await deleteProfile(activeProfileId);
    setDeleteOpen(false);
  };

  // No profile selected
  if (!activeProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selecciona un perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selecciona un perfil de la lista o crea uno nuevo para comenzar a configurar credenciales.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isConfigured = (service: ServiceName) =>
    activeProfile.configuredServices.includes(service);

  const SERVICE_LABELS: Record<ServiceName, string> = {
    shopify: "Shopify",
    meta: "Meta Ads",
    clarity: "Clarity",
    mercadopago: "MercadoPago",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Editar perfil</span>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Eliminar perfil</DialogTitle>
                <DialogDescription>
                  Estas seguro de que queres eliminar &quot;{activeProfile.name}&quot;?
                  Esto eliminara tambien todas las credenciales asociadas. Esta accion no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Eliminar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">
              General
            </TabsTrigger>
            <TabsTrigger value="shopify" className="flex-1">
              Shopify
            </TabsTrigger>
            <TabsTrigger value="meta" className="flex-1">
              Meta Ads
            </TabsTrigger>
            <TabsTrigger value="clarity" className="flex-1">
              Clarity
            </TabsTrigger>
            <TabsTrigger value="mercadopago" className="flex-1">
              MercadoPago
            </TabsTrigger>
            <TabsTrigger value="comprobantes" className="flex-1">
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Comprobantes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>Nombre del negocio</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Curso de Marketing"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {PROFILE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-all ${
                      color === c
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is-active-switch">Negocio activo</Label>
                <p className="text-xs text-muted-foreground">
                  Los negocios inactivos no reciben gastos nuevos
                </p>
              </div>
              <Switch
                id="is-active-switch"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            <Button onClick={handleSaveGeneral} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar
            </Button>
          </TabsContent>

          <TabsContent value="shopify" className="space-y-6 pt-4">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="shopify-enabled-switch">Habilitar datos de Shopify</Label>
                <p className="text-xs text-muted-foreground">
                  Desactiva para no traer datos de Shopify en este perfil
                </p>
              </div>
              <Switch
                id="shopify-enabled-switch"
                checked={!isServiceDisabled("shopify")}
                onCheckedChange={(checked) => handleToggleService("shopify", checked)}
              />
            </div>
            <ServiceStatusBadge
              configured={isConfigured("shopify")}
              validation={activeProfile.validationStatus?.shopify}
            />
            {isConfigured("shopify") && (
              <p className="text-xs text-muted-foreground">
                Las credenciales estan almacenadas de forma segura. Completa los campos para actualizarlas.
              </p>
            )}
            <CredentialField
              label="Store Domain"
              value={credentials.shopify?.storeDomain ?? ""}
              onChange={(v) => updateCreds("shopify", "storeDomain", v)}
              placeholder="tu-tienda.myshopify.com"
              helpText="El dominio de tu tienda Shopify (sin https://)"
            />
            <CredentialField
              label="API Version"
              value={credentials.shopify?.adminApiVersion ?? ""}
              onChange={(v) => updateCreds("shopify", "adminApiVersion", v)}
              placeholder="2026-01"
              helpText="Version del Admin API (ej: 2026-01)"
            />
            <CredentialField
              label="Client ID"
              value={credentials.shopify?.clientId ?? ""}
              onChange={(v) => updateCreds("shopify", "clientId", v)}
              placeholder="086458719205403c9c712d012f..."
              helpText="Client ID de tu app Shopify (para renovacion automatica del token)"
            />
            <CredentialField
              label="Client Secret"
              value={credentials.shopify?.clientSecret ?? ""}
              onChange={(v) => updateCreds("shopify", "clientSecret", v)}
              placeholder="shpss_..."
              isSecret
              helpText="Client Secret de tu app Shopify"
            />
            {credentials.shopify?.clientId && credentials.shopify?.clientSecret ? (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-3 space-y-1">
                <p className="text-xs font-medium text-green-700 dark:text-green-400">
                  Token auto-gestionado
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  El access token se renueva automaticamente cada 24hs usando las credenciales OAuth.
                  {credentials.shopify?.tokenExpiresAt && (
                    <> Expira: {new Date(credentials.shopify.tokenExpiresAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</>
                  )}
                </p>
              </div>
            ) : (
              <CredentialField
                label="Access Token"
                value={credentials.shopify?.adminAccessToken ?? ""}
                onChange={(v) => updateCreds("shopify", "adminAccessToken", v)}
                placeholder="shpat_..."
                isSecret
                helpText="Token de acceso del Admin API (manual, si no usas Client ID/Secret)"
              />
            )}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleSaveServiceCredentials("shopify")}
                disabled={savingService === "shopify"}
                size="sm"
              >
                {savingService === "shopify" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar credenciales
              </Button>
              <ConnectionTester profileId={activeProfileId} service="shopify" />
              {isConfigured("shopify") && (
                <Dialog
                  open={deleteServiceOpen === "shopify"}
                  onOpenChange={(open) => setDeleteServiceOpen(open ? "shopify" : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Borrar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Borrar credenciales de {SERVICE_LABELS.shopify}</DialogTitle>
                      <DialogDescription>
                        Se eliminaran las credenciales de {SERVICE_LABELS.shopify} de este perfil. Esta accion no se puede deshacer.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteServiceOpen(null)}>
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteServiceCredentials("shopify")}
                        disabled={deletingService === "shopify"}
                      >
                        {deletingService === "shopify" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Borrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TabsContent>

          <TabsContent value="meta" className="space-y-6 pt-4">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="meta-enabled-switch">Habilitar datos de Meta Ads</Label>
                <p className="text-xs text-muted-foreground">
                  Desactiva para no traer datos de Meta Ads en este perfil
                </p>
              </div>
              <Switch
                id="meta-enabled-switch"
                checked={!isServiceDisabled("meta")}
                onCheckedChange={(checked) => handleToggleService("meta", checked)}
              />
            </div>
            <ServiceStatusBadge
              configured={isConfigured("meta")}
              validation={activeProfile.validationStatus?.meta}
            />
            {isConfigured("meta") && (
              <p className="text-xs text-muted-foreground">
                Las credenciales estan almacenadas de forma segura. Completa los campos para actualizarlas.
              </p>
            )}
            <CredentialField
              label="Ad Account ID"
              value={credentials.meta?.adAccountId ?? ""}
              onChange={(v) => updateCreds("meta", "adAccountId", v)}
              placeholder="123456789 (solo números, sin el prefijo 'act_')"
              helpText="ID de tu cuenta publicitaria de Meta. Encuéntralo en Configuración de la cuenta > Información de la cuenta. Solo ingresa los números, sin el prefijo 'act_'."
            />
            <CredentialField
              label="Access Token"
              value={credentials.meta?.accessToken ?? ""}
              onChange={(v) => updateCreds("meta", "accessToken", v)}
              placeholder="EAA..."
              isSecret
              helpText="Token de acceso de larga duración de Meta. Permisos requeridos: ads_read, ads_management, business_management, pages_read_engagement"
            />
            <CredentialField
              label="API Version"
              value={credentials.meta?.apiVersion ?? ""}
              onChange={(v) => updateCreds("meta", "apiVersion", v)}
              placeholder="v21.0"
              helpText="Version del Graph API (ej: v21.0)"
            />

            {/* Promociones de Instagram */}
            <div className="space-y-4 pt-4 border-t border-border/30">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Promociones de Instagram</Label>
                <p className="text-xs text-muted-foreground">
                  Opcional. Si usas una cuenta publicitaria personal para promocionar posts de Instagram, completa estos campos.
                </p>
              </div>
              <CredentialField
                label="Promotions Ad Account ID"
                value={credentials.meta?.promotionsAdAccountId ?? ""}
                onChange={(v) => updateCreds("meta", "promotionsAdAccountId", v)}
                placeholder="206192705 (solo numeros, sin 'act_')"
                helpText="ID de la cuenta publicitaria personal donde se registran las promociones de Instagram"
              />
              <CredentialField
                label="Promotions Access Token"
                value={credentials.meta?.promotionsAccessToken ?? ""}
                onChange={(v) => updateCreds("meta", "promotionsAccessToken", v)}
                placeholder="Dejar vacio para usar el mismo token"
                isSecret
                helpText="Token para la cuenta de promociones. Si es el mismo token que arriba, dejalo vacio."
              />
              <CredentialField
                label="Dominio de Promociones"
                value={credentials.meta?.promotionsDomain ?? ""}
                onChange={(v) => updateCreds("meta", "promotionsDomain", v)}
                placeholder="mueblesfactory.shop"
                helpText="Dominio o URL que identifica a este negocio en los enlaces de las promociones (ej: mueblesfactory.shop, academiadelcerrajero.site)"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleSaveServiceCredentials("meta")}
                disabled={savingService === "meta"}
                size="sm"
              >
                {savingService === "meta" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar credenciales
              </Button>
              <ConnectionTester profileId={activeProfileId} service="meta" onMetaAccountInfo={handleMetaAccountInfo} />
              {isConfigured("meta") && (
                <Dialog
                  open={deleteServiceOpen === "meta"}
                  onOpenChange={(open) => setDeleteServiceOpen(open ? "meta" : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Borrar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Borrar credenciales de {SERVICE_LABELS.meta}</DialogTitle>
                      <DialogDescription>
                        Se eliminaran las credenciales de {SERVICE_LABELS.meta} de este perfil. Esta accion no se puede deshacer.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteServiceOpen(null)}>
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteServiceCredentials("meta")}
                        disabled={deletingService === "meta"}
                      >
                        {deletingService === "meta" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Borrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clarity" className="space-y-6 pt-4">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="clarity-enabled-switch">Habilitar datos de Clarity</Label>
                <p className="text-xs text-muted-foreground">
                  Desactiva para no traer datos de Clarity en este perfil
                </p>
              </div>
              <Switch
                id="clarity-enabled-switch"
                checked={!isServiceDisabled("clarity")}
                onCheckedChange={(checked) => handleToggleService("clarity", checked)}
              />
            </div>
            <ServiceStatusBadge
              configured={isConfigured("clarity")}
              validation={activeProfile.validationStatus?.clarity}
            />
            {isConfigured("clarity") && (
              <p className="text-xs text-muted-foreground">
                Las credenciales estan almacenadas de forma segura. Completa los campos para actualizarlas.
              </p>
            )}
            <CredentialField
              label="Project ID"
              value={credentials.clarity?.projectId ?? ""}
              onChange={(v) => updateCreds("clarity", "projectId", v)}
              placeholder="abc123def"
              helpText="ID del proyecto en Microsoft Clarity"
            />
            <CredentialField
              label="API Token"
              value={credentials.clarity?.apiToken ?? ""}
              onChange={(v) => updateCreds("clarity", "apiToken", v)}
              placeholder="eyJ..."
              isSecret
              helpText="Token JWT Bearer de Clarity"
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleSaveServiceCredentials("clarity")}
                disabled={savingService === "clarity"}
                size="sm"
              >
                {savingService === "clarity" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar credenciales
              </Button>
              <ConnectionTester profileId={activeProfileId} service="clarity" />
              {isConfigured("clarity") && (
                <Dialog
                  open={deleteServiceOpen === "clarity"}
                  onOpenChange={(open) => setDeleteServiceOpen(open ? "clarity" : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Borrar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Borrar credenciales de {SERVICE_LABELS.clarity}</DialogTitle>
                      <DialogDescription>
                        Se eliminaran las credenciales de {SERVICE_LABELS.clarity} de este perfil. Esta accion no se puede deshacer.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteServiceOpen(null)}>
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteServiceCredentials("clarity")}
                        disabled={deletingService === "clarity"}
                      >
                        {deletingService === "clarity" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Borrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mercadopago" className="space-y-6 pt-4">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="mp-enabled-switch">Habilitar datos de MercadoPago</Label>
                <p className="text-xs text-muted-foreground">
                  Desactiva para no traer datos de MercadoPago en este perfil
                </p>
              </div>
              <Switch
                id="mp-enabled-switch"
                checked={!isServiceDisabled("mercadopago")}
                onCheckedChange={(checked) => handleToggleService("mercadopago", checked)}
              />
            </div>
            <ServiceStatusBadge
              configured={isConfigured("mercadopago")}
              validation={activeProfile.validationStatus?.mercadopago}
            />
            {isConfigured("mercadopago") && (
              <p className="text-xs text-muted-foreground">
                Las credenciales estan almacenadas de forma segura. Completa los campos para actualizarlas.
              </p>
            )}
            <CredentialField
              label="Access Token"
              value={credentials.mercadopago?.accessToken ?? ""}
              onChange={(v) => updateCreds("mercadopago", "accessToken", v)}
              placeholder="APP_USR-..."
              isSecret
              helpText="Token de acceso de MercadoPago. Obtenelo en mercadopago.com.ar/developers/panel/app"
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleSaveServiceCredentials("mercadopago")}
                disabled={savingService === "mercadopago"}
                size="sm"
              >
                {savingService === "mercadopago" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar credenciales
              </Button>
              <ConnectionTester profileId={activeProfileId} service="mercadopago" />
              {isConfigured("mercadopago") && (
                <Dialog
                  open={deleteServiceOpen === "mercadopago"}
                  onOpenChange={(open) => setDeleteServiceOpen(open ? "mercadopago" : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Borrar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Borrar credenciales de {SERVICE_LABELS.mercadopago}</DialogTitle>
                      <DialogDescription>
                        Se eliminaran las credenciales de {SERVICE_LABELS.mercadopago} de este perfil. Esta accion no se puede deshacer.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteServiceOpen(null)}>
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteServiceCredentials("mercadopago")}
                        disabled={deletingService === "mercadopago"}
                      >
                        {deletingService === "mercadopago" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Borrar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Keywords section for transaction filtering */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div className="space-y-1">
                <Label>Palabras clave de transacciones</Label>
                <p className="text-xs text-muted-foreground">
                  Filtra las transacciones de MercadoPago por palabras clave en la descripcion.
                  Util cuando varias tiendas comparten la misma cuenta de MP.
                </p>
              </div>

              {mpKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {mpKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => setMpKeywords((prev) => prev.filter((_, i) => i !== idx))}
                        className="ml-0.5 hover:text-destructive transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder='Ej: "RobertoPugliese" o "World Wide Hustle"'
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!newKeyword.trim()}
                  onClick={handleAddKeyword}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Agregar
                </Button>
              </div>

              {mpKeywords.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Sin palabras clave: se mostraran todas las transacciones de la cuenta.
                </p>
              )}

              <Button
                onClick={handleSaveKeywords}
                disabled={savingKeywords}
                size="sm"
                variant="outline"
              >
                {savingKeywords ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar palabras clave
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="comprobantes" className="space-y-6 pt-4">
            <EmailConfigForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
