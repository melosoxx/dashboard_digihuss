"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  currentUrl: string;
  fallbackInitials: string;
  onUpload: (file: File) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
  uploading: boolean;
}

export function AvatarUpload({
  currentUrl,
  fallbackInitials,
  onUpload,
  onRemove,
  uploading,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const success = await onUpload(file);
    if (!success) {
      setPreview(null);
    } else {
      // Clear preview once the real URL is loaded from metadata
      setPreview(null);
    }

    URL.revokeObjectURL(objectUrl);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async () => {
    const success = await onRemove();
    if (success) setPreview(null);
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="h-24 w-24">
        {displayUrl && (
          <AvatarImage src={displayUrl} alt="Foto de perfil" />
        )}
        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
          {fallbackInitials}
        </AvatarFallback>
      </Avatar>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="mr-1.5 h-3.5 w-3.5" />
          )}
          Cambiar foto
        </Button>

        {currentUrl && !uploading && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Eliminar
          </Button>
        )}
      </div>
    </div>
  );
}
