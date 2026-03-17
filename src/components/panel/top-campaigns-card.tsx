"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/providers/currency-provider";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import type { MetaActiveAd } from "@/types/meta";

interface ActiveAdsCardProps {
  ads: MetaActiveAd[];
  isLoading: boolean;
}

function getCtrBadge(ctr: number) {
  if (ctr >= 2) return { className: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25" };
  if (ctr >= 1) return { className: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/25" };
  return { className: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/25" };
}

function formatDaysActive(createdAt: string): string {
  if (!createdAt) return "-";
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoy";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

function formatShortDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

export function ActiveAdsCard({ ads, isLoading }: ActiveAdsCardProps) {
  const { formatMoney } = useCurrency();
  const [previewAd, setPreviewAd] = useState<MetaActiveAd | null>(null);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const { activeProfileId } = useBusinessProfile();

  useEffect(() => {
    if (!previewAd) {
      setVideoSource(null);
      setLoadingVideo(false);
      return;
    }

    if (previewAd.objectType === "VIDEO" && previewAd.videoId) {
      setLoadingVideo(true);
      const params = new URLSearchParams({
        videoId: previewAd.videoId,
        profileId: activeProfileId,
      });
      fetch(`/api/meta/video-source?${params}`)
        .then((res) => res.json())
        .then((data) => setVideoSource(data.source || null))
        .catch(() => setVideoSource(null))
        .finally(() => setLoadingVideo(false));
    }
  }, [previewAd, activeProfileId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const sorted = [...ads].sort((a, b) => b.ctr - a.ctr);
  const isVideo = previewAd?.objectType === "VIDEO";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Anuncios Activos - Ranking por CTR</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No se encontraron anuncios activos
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Anuncio</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Conjunto</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-left pb-3">Campaña</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">CTR</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Resultados</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Impr.</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Gasto</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Creado</th>
                  <th className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pb-3">Activo</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((ad) => {
                  const ctrBadge = getCtrBadge(ad.ctr);
                  return (
                    <tr key={ad.adId} className="border-b border-border/10 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-150">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          {ad.thumbnailUrl && (
                            <button
                              onClick={() => setPreviewAd(ad)}
                              className="flex-shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                              title="Ver preview del anuncio"
                            >
                              {ad.objectType === "VIDEO" ? (
                                <Video className="size-3.5" />
                              ) : (
                                <ImageIcon className="size-3.5" />
                              )}
                            </button>
                          )}
                          <span className="text-[13px] font-medium truncate block max-w-[200px]" title={ad.adName}>
                            {ad.adName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[13px] text-muted-foreground truncate block max-w-[160px]" title={ad.adsetName}>
                          {ad.adsetName || "-"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-[13px] text-muted-foreground truncate block max-w-[160px]" title={ad.campaignName}>
                          {ad.campaignName || "-"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant="outline" className={cn("text-[10px] font-semibold border", ctrBadge.className)}>
                          {ad.ctr.toFixed(2)}%
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        {ad.conversions > 0 ? (
                          <Badge variant="outline" className="text-[10px] font-semibold border bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25">
                            {ad.conversions}
                          </Badge>
                        ) : (
                          <span className="text-[13px] text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">
                        {ad.impressions.toLocaleString("es-AR")}
                      </td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">
                        {formatMoney(ad.spend)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground text-[13px]">
                        {formatShortDate(ad.createdAt)}
                      </td>
                      <td className="py-3 text-right text-[13px]">
                        {formatDaysActive(ad.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={!!previewAd} onOpenChange={(open) => !open && setPreviewAd(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-medium truncate">
                {previewAd?.adName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {isVideo ? "Video" : "Imagen"} &middot; {previewAd?.campaignName}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              {isVideo && loadingVideo && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {isVideo && !loadingVideo && videoSource && (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={videoSource}
                  controls
                  className="rounded-md max-h-[400px] w-auto"
                  poster={previewAd?.thumbnailUrl}
                />
              )}
              {isVideo && !loadingVideo && !videoSource && previewAd?.thumbnailUrl && (
                // Fallback: show thumbnail if video source unavailable
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewAd.thumbnailUrl}
                  alt={`Preview de ${previewAd.adName}`}
                  className="rounded-md max-h-[400px] w-auto object-contain"
                />
              )}
              {!isVideo && previewAd?.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewAd.thumbnailUrl}
                  alt={`Preview de ${previewAd.adName}`}
                  className="rounded-md max-h-[400px] w-auto object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
