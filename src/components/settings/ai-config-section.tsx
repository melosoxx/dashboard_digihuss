"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Wifi,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAIConfig } from "@/hooks/use-ai-config";
import { AI_MODELS } from "@/types/ai";
import type { AIProvider } from "@/types/ai";

export function AIConfigSection() {
  const { config, isLoading: configLoading, invalidate } = useAIConfig();

  const [provider, setProvider] = useState<AIProvider>("openai");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "deleting">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Populate from existing config
  useEffect(() => {
    if (config?.configured) {
      setProvider(config.provider);
      setModel(config.model);
    }
  }, [config]);

  // Reset model when provider changes
  const handleProviderChange = (value: AIProvider) => {
    setProvider(value);
    const models = AI_MODELS[value];
    setModel(models[0].id);
  };

  // Set default model on first render if empty
  useEffect(() => {
    if (!model && !configLoading) {
      setModel(AI_MODELS[provider][0].id);
    }
  }, [model, provider, configLoading]);

  const handleSave = async () => {
    if (!apiKey && !config?.configured) return;
    setSaveStatus("saving");
    setErrorMessage("");
    try {
      const body: Record<string, string> = { provider, model };
      if (apiKey) body.apiKey = apiKey;
      else if (!config?.configured) return;

      // If no new key provided but already configured, we need to send something
      if (!apiKey && config?.configured) {
        // Just update provider/model without changing the key
        // We need the key — prompt user
        setSaveStatus("error");
        setErrorMessage("Ingresa tu API key para guardar los cambios");
        return;
      }

      const res = await fetch("/api/ai/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al guardar");
      }

      setSaveStatus("success");
      setApiKey("");
      invalidate();
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setErrorMessage((err as Error).message);
    }
  };

  const handleTest = async () => {
    const keyToTest = apiKey || "";
    if (!keyToTest) {
      setTestStatus("error");
      setErrorMessage("Ingresa una API key para probar");
      return;
    }
    setTestStatus("testing");
    setErrorMessage("");
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, apiKey: keyToTest }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus("success");
        setTimeout(() => setTestStatus("idle"), 3000);
      } else {
        setTestStatus("error");
        setErrorMessage(data.error || "Error de conexión");
      }
    } catch {
      setTestStatus("error");
      setErrorMessage("Error de conexión");
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar la configuración de Huss?")) return;
    setDeleteStatus("deleting");
    try {
      await fetch("/api/ai/config", { method: "DELETE" });
      setProvider("openai");
      setModel(AI_MODELS.openai[0].id);
      setApiKey("");
      invalidate();
    } finally {
      setDeleteStatus("idle");
    }
  };

  if (configLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const models = AI_MODELS[provider];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-cyan-500" />
          Huss (Asistente IA)
          {config?.configured && (
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400">
              Configurado
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Provider */}
        <div className="space-y-2">
          <Label>Proveedor</Label>
          <Select value={provider} onValueChange={(v) => handleProviderChange(v as AIProvider)}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <Label>Modelo</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <Label>API Key</Label>
          <div className="flex gap-2">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={config?.configured ? "••••••••  (ingresa una nueva para cambiar)" : "sk-..."}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowKey(!showKey)}
              className="shrink-0"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tu clave se almacena encriptada y nunca se expone al navegador.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button onClick={handleSave} disabled={saveStatus === "saving" || (!apiKey && !config?.configured)}>
            {saveStatus === "saving" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar
          </Button>

          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testStatus === "testing" || !apiKey}
          >
            {testStatus === "testing" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wifi className="mr-2 h-4 w-4" />
            )}
            Probar conexion
          </Button>

          {config?.configured && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteStatus === "deleting"}
              className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              {deleteStatus === "deleting" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </Button>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex flex-wrap items-center gap-3">
          {saveStatus === "success" && (
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Guardado
            </span>
          )}
          {testStatus === "success" && (
            <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Conexion exitosa
            </span>
          )}
          {(saveStatus === "error" || testStatus === "error") && errorMessage && (
            <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              {errorMessage}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
