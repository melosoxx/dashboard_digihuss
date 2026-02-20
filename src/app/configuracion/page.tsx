"use client";

import { useBusinessProfile } from "@/providers/business-profile-provider";
import { ProfileList } from "@/components/settings/profile-list";
import { ProfileEditor } from "@/components/settings/profile-editor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function ConfiguracionPage() {
  const {
    profiles,
    aggregateMode,
    selectedProfileIds,
    setAggregateMode,
    setSelectedProfileIds,
  } = useBusinessProfile();

  const toggleProfileSelection = (id: string) => {
    setSelectedProfileIds(
      selectedProfileIds.includes(id)
        ? selectedProfileIds.filter((pid) => pid !== id)
        : [...selectedProfileIds, id]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configuracion
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus perfiles de negocio y claves API
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left column: Profile list + Aggregate mode */}
        <div className="space-y-6">
          <ProfileList />

          {profiles.length >= 2 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Vista Agregada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={aggregateMode}
                    onCheckedChange={setAggregateMode}
                    id="aggregate-mode"
                  />
                  <Label htmlFor="aggregate-mode" className="text-sm">
                    Combinar datos de multiples perfiles
                  </Label>
                </div>

                {aggregateMode && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Selecciona los perfiles a combinar:
                    </p>
                    {profiles.map((profile) => (
                      <label
                        key={profile.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProfileIds.includes(profile.id)}
                          onChange={() => toggleProfileSelection(profile.id)}
                          className="rounded"
                        />
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: profile.color }}
                        />
                        <span className="text-sm truncate">{profile.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Profile editor */}
        <ProfileEditor />
      </div>
    </div>
  );
}
