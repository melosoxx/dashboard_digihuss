"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface CredentialFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isSecret?: boolean;
  helpText?: string;
}

export function CredentialField({
  label,
  value,
  onChange,
  placeholder,
  isSecret = false,
  helpText,
}: CredentialFieldProps) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type={isSecret && !showSecret ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-mono text-sm"
        />
        {isSecret && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowSecret(!showSecret)}
            className="shrink-0"
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
