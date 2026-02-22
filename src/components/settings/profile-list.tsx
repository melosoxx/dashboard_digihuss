"use client";

import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus, Server, CheckCircle2 } from "lucide-react";

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

  const { data: envCheck } = useQuery<Record<string, boolean>>({
    queryKey: ["env-check"],
    queryFn: async () => {
      const res = await fetch("/api/env-check");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 60_000,
  });

  const defaultServices = envCheck
    ? (Object.entries(envCheck)
        .filter(([, active]) => active)
        .map(([key]) => SERVICE_LABELS[key] ?? key))
    : [];

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
            {defaultServices.length > 0 ? (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-500 truncate">
                  {defaultServices.join(", ")}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin servicios configurados</p>
            )}
          </div>
        </div>
      </Card>

      {/* User profiles */}
      {profiles.map((profile) => {
        const serviceLabels = profile.configuredServices
          .map((s) => SERVICE_LABELS[s] ?? s);

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
                  {serviceLabels.length > 0
                    ? serviceLabels.join(", ")
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
