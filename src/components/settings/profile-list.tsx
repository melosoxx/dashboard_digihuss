"use client";

import { useBusinessProfile } from "@/providers/business-profile-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus, Server } from "lucide-react";

const SERVICE_LABELS: Record<string, string> = {
  shopify: "Shopify",
  meta: "Meta Ads",
  clarity: "Clarity",
};

export function ProfileList() {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    addProfile,
  } = useBusinessProfile();

  const handleAddProfile = () => {
    addProfile({ name: `Negocio ${profiles.length + 1}` });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Perfiles</h3>

      {/* Default env-var profile */}
      <Card
        className={cn(
          "cursor-pointer p-3 transition-colors hover:bg-accent",
          activeProfileId === null && "border-primary bg-primary/5"
        )}
        onClick={() => setActiveProfileId(null)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <Server className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">Predeterminado</p>
            <p className="text-xs text-muted-foreground">Variables de entorno</p>
          </div>
        </div>
      </Card>

      {/* User profiles */}
      {profiles.map((profile) => {
        const configuredServices = Object.entries(profile.credentials)
          .filter(([, val]) => {
            if (!val) return false;
            return Object.values(val).some((v) => v && String(v).length > 0);
          })
          .map(([key]) => SERVICE_LABELS[key] ?? key);

        return (
          <Card
            key={profile.id}
            className={cn(
              "cursor-pointer p-3 transition-colors hover:bg-accent",
              activeProfileId === profile.id && "border-primary bg-primary/5"
            )}
            onClick={() => setActiveProfileId(profile.id)}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                style={{ backgroundColor: profile.color }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {configuredServices.length > 0
                    ? configuredServices.join(", ")
                    : "Sin configurar"}
                </p>
              </div>
            </div>
          </Card>
        );
      })}

      <Button
        variant="outline"
        className="w-full"
        onClick={handleAddProfile}
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar perfil
      </Button>
    </div>
  );
}
