"use client";

import { useState, useEffect } from "react";
import { Lock, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "./avatar-upload";
import { useUserProfile } from "@/hooks/use-user-profile";

export function ProfileTab() {
  const {
    displayName,
    avatarUrl,
    email,
    saving,
    error,
    success,
    updateDisplayName,
    uploadAvatar,
    removeAvatar,
    clearMessages,
  } = useUserProfile();

  const [name, setName] = useState(displayName);

  useEffect(() => {
    setName(displayName);
  }, [displayName]);

  const initials = (displayName || email || "U")
    .split(/[\s@]/)[0]
    .slice(0, 2)
    .toUpperCase();

  const hasChanges = name !== displayName;

  const handleSave = async () => {
    if (!hasChanges) return;
    await updateDisplayName(name.trim());
  };

  return (
    <div className="space-y-6 pt-4">
      <AvatarUpload
        currentUrl={avatarUrl}
        fallbackInitials={initials}
        onUpload={uploadAvatar}
        onRemove={removeAvatar}
        uploading={saving}
      />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display-name">Nombre para mostrar</Label>
          <Input
            id="display-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearMessages();
            }}
            placeholder="Tu nombre"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Input
              id="email"
              value={email}
              disabled
              className="pr-9 opacity-60"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            El email no se puede cambiar
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={!hasChanges || saving}
        className="w-full"
      >
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Guardar cambios
      </Button>
    </div>
  );
}
