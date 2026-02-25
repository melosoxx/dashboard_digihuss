"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Layers, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * When there are 0–1 custom profiles, render the original Select dropdown.
 * When there are 2+ custom profiles, render a Popover with checkboxes so the
 * user can pick one profile (individual) or several (aggregate mode).
 */
export function ProfileSwitcher() {
  const router = useRouter();
  const {
    profiles,
    activeProfileId,
    aggregateMode,
    selectedProfileIds,
    setActiveProfileId,
    setAggregateMode,
    setSelectedProfileIds,
    isHydrated,
  } = useBusinessProfile();

  const [open, setOpen] = useState(false);

  if (!isHydrated) return null;
  if (profiles.length === 0) return null;

  // ---- 2+ custom profiles → multi-select Popover ----
  if (profiles.length >= 2) {
    return (
      <MultiSelectSwitcher
        profiles={profiles}
        activeProfileId={activeProfileId}
        aggregateMode={aggregateMode}
        selectedProfileIds={selectedProfileIds}
        setActiveProfileId={setActiveProfileId}
        setAggregateMode={setAggregateMode}
        setSelectedProfileIds={setSelectedProfileIds}
        open={open}
        setOpen={setOpen}
        onSettings={() => {
          router.push("/configuracion");
          setOpen(false);
        }}
      />
    );
  }

  // ---- 0-1 custom profiles → simple Select ----
  const handleChange = (value: string) => {
    if (value === "__settings__") {
      router.push("/configuracion");
      return;
    }
    setActiveProfileId(value);
  };

  const currentValue = activeProfileId;
  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px] h-9">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: activeProfile?.color ?? "#3b82f6" }}
            />
            <span className="truncate">{activeProfile?.name ?? "Seleccionar"}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
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

// ----- Multi-select Popover (2+ profiles) -----

interface MultiSelectProps {
  profiles: { id: string; name: string; color: string }[];
  activeProfileId: string;
  aggregateMode: boolean;
  selectedProfileIds: string[];
  setActiveProfileId: (id: string) => void;
  setAggregateMode: (enabled: boolean) => void;
  setSelectedProfileIds: (ids: string[]) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  onSettings: () => void;
}

function MultiSelectSwitcher({
  profiles,
  activeProfileId,
  aggregateMode,
  selectedProfileIds,
  setActiveProfileId,
  setAggregateMode,
  setSelectedProfileIds,
  open,
  setOpen,
  onSettings,
}: MultiSelectProps) {
  // Build the current checked set
  const checkedIds = aggregateMode
    ? selectedProfileIds
    : [activeProfileId];

  const handleToggle = (profileId: string) => {
    const isChecked = checkedIds.includes(profileId);

    let next: string[];
    if (isChecked) {
      next = checkedIds.filter((id) => id !== profileId);
      if (next.length === 0) return; // at least 1 must remain
    } else {
      next = [...checkedIds, profileId];
    }

    if (next.length === 1) {
      if (aggregateMode) setAggregateMode(false);
      setActiveProfileId(next[0]);
    } else {
      if (!aggregateMode) setAggregateMode(true);
      setSelectedProfileIds(next);
      // Keep activeProfileId pointing to first selected for non-aggregated hooks
      setActiveProfileId(next[0]);
    }
  };

  // Trigger label
  const triggerContent = aggregateMode ? (
    <span className="flex items-center gap-2 min-w-0">
      <Layers className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{checkedIds.length} negocios</span>
    </span>
  ) : (() => {
    const p = profiles.find((pr) => pr.id === activeProfileId);
    if (!p) {
      return (
        <span className="flex items-center gap-2 min-w-0">
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: profiles[0].color }}
          />
          <span className="truncate">{profiles[0].name}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-2 min-w-0">
        <span
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: p.color }}
        />
        <span className="truncate">{p.name}</span>
      </span>
    );
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] h-9 justify-between"
        >
          {triggerContent}
          <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[220px] p-0" align="start">
        <div className="p-2 space-y-0.5">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Seleccionar negocios
          </p>
          {profiles.map((profile) => {
            const isChecked = checkedIds.includes(profile.id);
            return (
              <button
                key={profile.id}
                type="button"
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-md px-2 py-1.5 text-sm transition-colors",
                  "hover:bg-accent cursor-pointer",
                  isChecked && "bg-accent/50"
                )}
                onClick={() => handleToggle(profile.id)}
              >
                <div
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
                    isChecked
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30"
                  )}
                >
                  {isChecked && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: profile.color }}
                />
                <span className="truncate">{profile.name}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t p-2">
          <button
            type="button"
            className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent cursor-pointer transition-colors"
            onClick={onSettings}
          >
            <Settings className="h-3.5 w-3.5" />
            Gestionar perfiles
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
