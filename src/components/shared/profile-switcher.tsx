"use client";

import { useRouter } from "next/navigation";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, Server, Settings } from "lucide-react";

export function ProfileSwitcher() {
  const router = useRouter();
  const {
    profiles,
    activeProfileId,
    aggregateMode,
    setActiveProfileId,
    isHydrated,
  } = useBusinessProfile();

  // Don't render until hydrated to prevent mismatch
  if (!isHydrated) return null;

  // If no profiles exist, don't show the switcher
  if (profiles.length === 0) return null;

  const handleChange = (value: string) => {
    if (value === "__settings__") {
      router.push("/configuracion");
      return;
    }
    setActiveProfileId(value === "__default__" ? null : value);
  };

  const currentValue = aggregateMode
    ? "__aggregate__"
    : activeProfileId ?? "__default__";

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px] h-9">
        <SelectValue>
          {aggregateMode ? (
            <span className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" />
              <span className="truncate">Vista Agregada</span>
            </span>
          ) : activeProfile ? (
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: activeProfile.color }}
              />
              <span className="truncate">{activeProfile.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5" />
              <span className="truncate">Predeterminado</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__default__">
          <span className="flex items-center gap-2">
            <Server className="h-3.5 w-3.5" />
            Predeterminado (env)
          </span>
        </SelectItem>
        {profiles.map((profile) => (
          <SelectItem key={profile.id} value={profile.id}>
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: profile.color }}
              />
              {profile.name}
            </span>
          </SelectItem>
        ))}
        <SelectItem value="__settings__">
          <span className="flex items-center gap-2">
            <Settings className="h-3.5 w-3.5" />
            Gestionar perfiles
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
