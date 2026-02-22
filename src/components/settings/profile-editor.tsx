"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Save, Trash2, Loader2, CheckCircle2, Shield, Server, Plus } from "lucide-react";
import type { ServiceCredentials, ServiceName } from "@/types/business";

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

function ServiceStatusBadge({ configured }: { configured: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      configured
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
    }`}>
      {configured ? (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Configurado
        </>
      ) : (
        <>
          <Shield className="h-3 w-3" />
          No configurado
        </>
      )}
    </div>
  );
}

/** Editor shown when the env-var default profile is selected (no DB profile) */
function DefaultProfileCard() {
  const { addProfile, setActiveProfileId, profiles } = useBusinessProfile();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Try to fetch Meta business name from env vars
      let profileName = `Negocio ${profiles.length + 1}`;
      try {
        const params = new URLSearchParams({ service: "meta" });
        const res = await fetch(`/api/test-connection?${params}`, { method: "POST" });
        const data = await res.json();
        if (data.meta && data.metaAccountInfo?.businessName) {
          profileName = data.metaAccountInfo.businessName;
        } else if (data.meta && data.metaAccountInfo?.accountName) {
          profileName = data.metaAccountInfo.accountName;
        }
      } catch {
        // Keep default name
      }

      const profile = await addProfile({
        name: profileName,
        color: PROFILE_COLORS[profiles.length % PROFILE_COLORS.length],
      });
      setActiveProfileId(profile.id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Perfil predeterminado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Este perfil usa variables de entorno del servidor. Para poder editar o borrar credenciales
          desde aca, crea un perfil personalizado.
        </p>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Crear perfil editable
        </Button>
      </CardContent>
    </Card>
  );
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

  const [name, setName] = useState("");
  const [color, setColor] = useState(PROFILE_COLORS[0]);
  const [credentials, setCredentials] = useState<ServiceCredentials>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteServiceOpen, setDeleteServiceOpen] = useState<ServiceName | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingService, setSavingService] = useState<ServiceName | null>(null);
  const [deletingService, setDeletingService] = useState<ServiceName | null>(null);

  // Sync form state when active profile changes
  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name);
      setColor(activeProfile.color);
      // Reset credential forms (credentials are write-only, stored encrypted on server)
      setCredentials({});
    }
  }, [activeProfile]);

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
      await updateProfile(activeProfileId, { name, color });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveServiceCredentials = async (service: ServiceName) => {
    if (!activeProfileId) return;
    const serviceCreds = credentials[service];
    if (!serviceCreds) return;

    // Check all fields have values
    const values = Object.values(serviceCreds);
    if (values.length === 0 || values.some((v) => !v || String(v).trim() === "")) return;

    setSavingService(service);
    try {
      await saveCredentials(
        activeProfileId,
        service,
        serviceCreds as unknown as Record<string, string>
      );
      // Clear form after save
      setCredentials((prev) => ({ ...prev, [service]: undefined }));
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

  const handleDelete = async () => {
    if (!activeProfileId) return;
    await deleteProfile(activeProfileId);
    setDeleteOpen(false);
  };

  // Default env-var profile selected
  if (!activeProfile && activeProfileId === null) {
    return <DefaultProfileCard />;
  }

  // No profile selected at all
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
            <ServiceStatusBadge configured={isConfigured("shopify")} />
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
              label="Access Token"
              value={credentials.shopify?.adminAccessToken ?? ""}
              onChange={(v) => updateCreds("shopify", "adminAccessToken", v)}
              placeholder="shpat_..."
              isSecret
              helpText="Token de acceso del Admin API"
            />
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
            <ServiceStatusBadge configured={isConfigured("meta")} />
            {isConfigured("meta") && (
              <p className="text-xs text-muted-foreground">
                Las credenciales estan almacenadas de forma segura. Completa los campos para actualizarlas.
              </p>
            )}
            <CredentialField
              label="Ad Account ID"
              value={credentials.meta?.adAccountId ?? ""}
              onChange={(v) => updateCreds("meta", "adAccountId", v)}
              placeholder="123456789"
              helpText="ID de tu cuenta publicitaria de Meta"
            />
            <CredentialField
              label="Access Token"
              value={credentials.meta?.accessToken ?? ""}
              onChange={(v) => updateCreds("meta", "accessToken", v)}
              placeholder="EAA..."
              isSecret
              helpText="Token de acceso de larga duracion de Meta"
            />
            <CredentialField
              label="API Version"
              value={credentials.meta?.apiVersion ?? ""}
              onChange={(v) => updateCreds("meta", "apiVersion", v)}
              placeholder="v21.0"
              helpText="Version del Graph API (ej: v21.0)"
            />
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
            <ServiceStatusBadge configured={isConfigured("clarity")} />
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
