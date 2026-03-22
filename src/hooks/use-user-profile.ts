"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";

export function useUserProfile() {
  const { user, updateUser, refreshUser, verifyPassword, sendPasswordReset } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const displayName = (user?.user_metadata?.display_name as string) ?? "";
  const avatarUrl = (user?.user_metadata?.avatar_url as string) ?? "";
  const email = user?.email ?? "";

  const updateDisplayName = useCallback(
    async (name: string) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const { error } = await updateUser({ data: { display_name: name } });
      setSaving(false);
      if (error) {
        setError("No se pudo actualizar el nombre");
        return false;
      }
      setSuccess("Nombre actualizado correctamente");
      return true;
    },
    [updateUser]
  );

  const updatePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Verify current password first
      const { error: verifyError } = await verifyPassword(currentPassword);
      if (verifyError) {
        setSaving(false);
        setError("La contraseña actual es incorrecta");
        return false;
      }

      const { error } = await updateUser({ password: newPassword });
      setSaving(false);
      if (error) {
        setError(
          error.message.includes("same_password")
            ? "La nueva contraseña debe ser diferente a la actual"
            : "No se pudo actualizar la contraseña"
        );
        return false;
      }
      setSuccess("Contraseña actualizada correctamente");
      return true;
    },
    [updateUser, verifyPassword]
  );

  const requestPasswordReset = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const { error } = await sendPasswordReset();
    setSaving(false);
    if (error) {
      setError("No se pudo enviar el email de recuperación");
      return false;
    }
    setSuccess("Se envió un email de recuperación a tu correo");
    return true;
  }, [sendPasswordReset]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      setSaving(true);
      setError(null);
      setSuccess(null);
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const res = await fetch("/api/account/avatar", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al subir la imagen");
        }
        await refreshUser();
        setSuccess("Foto de perfil actualizada");
        return true;
      } catch (err) {
        setError((err as Error).message || "No se pudo subir la imagen");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refreshUser]
  );

  const removeAvatar = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar la imagen");
      }
      await refreshUser();
      setSuccess("Foto de perfil eliminada");
      return true;
    } catch (err) {
      setError((err as Error).message || "No se pudo eliminar la imagen");
      return false;
    } finally {
      setSaving(false);
    }
  }, [refreshUser]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    displayName,
    avatarUrl,
    email,
    saving,
    error,
    success,
    updateDisplayName,
    updatePassword,
    requestPasswordReset,
    uploadAvatar,
    removeAvatar,
    clearMessages,
  };
}
