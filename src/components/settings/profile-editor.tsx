"use client";

import { useState, useEffect, useCallback } from "react";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CredentialField } from "./credential-field";
import { ConnectionTester } from "./connection-tester";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Save, Trash2, Server, Info } from "lucide-react";
import type { ServiceCredentials } from "@/types/business";

const PROFILE_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

function EnvCheckBadge() {
  const [envStatus, setEnvStatus] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    fetch("/api/env-check")
      .then((r) => r.json())
      .then(setEnvStatus)
      .catch(() => null);
  }, []);

  if (!envStatus) return null;

  const services = [
    { key: "shopify", label: "Shopify" },
    { key: "meta", label: "Meta Ads" },
    { key: "clarity", label: "Clarity" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        Estado de variables de entorno
      </div>
      <div className="flex flex-wrap gap-2">
        {services.map(({ key, label }) => (
          <span
            key={key}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              envStatus[key]
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                envStatus[key] ? "bg-green-600 dark:bg-green-400" : "bg-red-600 dark:bg-red-400"
              }`}
            />
            {label}: {envStatus[key] ? "Configurado" : "No configurado"}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ProfileEditor() {
  const { activeProfile, activeProfileId, updateProfile, deleteProfile } =
    useBusinessProfile();

  const [name, setName] = useState("");
  const [color, setColor] = useState(PROFILE_COLORS[0]);
  const [credentials, setCredentials] = useState<ServiceCredentials>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Sync form state when active profile changes
  useEffect(() => {
    if (activeProfile) {
      setName(activeProfile.name);
      setColor(activeProfile.color);
      setCredentials(activeProfile.credentials);
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

  const handleSave = () => {
    if (!activeProfileId) return;
    updateProfile(activeProfileId, { name, color, credentials });
  };

  const handleDelete = () => {
    if (!activeProfileId) return;
    deleteProfile(activeProfileId);
    setDeleteOpen(false);
  };

  // Default/env-var mode
  if (!activeProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Modo predeterminado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Estas usando las variables de entorno configuradas en el servidor.
            Para usar credenciales personalizadas, crea un nuevo perfil de negocio.
          </p>
          <EnvCheckBadge />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Editar perfil</span>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Save className="mr-2 h-4 w-4" />
              Guardar
            </Button>
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
                    Esta accion no se puede deshacer.
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
          </div>
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
          </TabsContent>

          <TabsContent value="shopify" className="space-y-6 pt-4">
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
            <ConnectionTester credentials={credentials} service="shopify" />
          </TabsContent>

          <TabsContent value="meta" className="space-y-6 pt-4">
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
            <ConnectionTester credentials={credentials} service="meta" />
          </TabsContent>

          <TabsContent value="clarity" className="space-y-6 pt-4">
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
            <ConnectionTester credentials={credentials} service="clarity" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
