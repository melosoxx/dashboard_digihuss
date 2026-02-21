"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Map } from "lucide-react";
import { useBusinessProfile } from "@/providers/business-profile-provider";

export function ClarityHeatmapLink({ isLoading }: { isLoading?: boolean }) {
  const { activeProfileId } = useBusinessProfile();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setResolved(false);
    const params = new URLSearchParams();
    if (activeProfileId) params.set("profileId", activeProfileId);

    fetch(`/api/clarity/project-id?${params}`)
      .then((res) => res.json())
      .then((data: { projectId: string | null }) => {
        setProjectId(data.projectId);
      })
      .catch(() => {
        setProjectId(null);
      })
      .finally(() => setResolved(true));
  }, [activeProfileId]);

  if (isLoading || !resolved) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const clarityUrl = projectId
    ? `https://clarity.microsoft.com/projects/view/${projectId}/heatmaps`
    : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
            <Map className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Heatmaps de Clarity
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Ver clics, scroll y zonas de atencion reales en tu sitio
            </p>
          </div>
        </div>
        <div className="mt-3">
          {clarityUrl ? (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={clarityUrl} target="_blank" rel="noopener noreferrer">
                Abrir Heatmap
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground/70">
                Configura tu Project ID de Clarity en Configuracion para habilitar el enlace directo
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
