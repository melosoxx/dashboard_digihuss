"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  activeAds: MetaActiveAd[];
  inactiveAds: MetaActiveAd[];
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

const thClass = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3 border-r border-border/15 last:border-r-0";
const tdClass = "py-3 border-r border-border/10 last:border-r-0";

function ColGroup({ showActive }: { showActive?: boolean }) {
  return (
    <colgroup>
      <col style={{ width: "18%" }} />
      <col style={{ width: "13%" }} />
      <col style={{ width: "14%" }} />
      <col style={{ width: "7%" }} />
      <col style={{ width: "9%" }} />
      <col style={{ width: "10%" }} />
      <col style={{ width: "8%" }} />
      <col style={{ width: "8%" }} />
      <col style={{ width: "7%" }} />
      {showActive && <col style={{ width: "6%" }} />}
    </colgroup>
  );
}

function AdsRow({ ad, muted, showActive, setPreviewAd, formatMoney }: {
  ad: MetaActiveAd;
  muted?: boolean;
  showActive?: boolean;
  setPreviewAd: (ad: MetaActiveAd) => void;
  formatMoney: (v: number) => string;
}) {
  const ctrBadge = getCtrBadge(ad.ctr);
  return (
    <tr className="border-b border-border/10 last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors duration-150">
      <td className={cn(tdClass, "px-2")}>
        <div className="flex items-center gap-1.5">
          {ad.thumbnailUrl && (
            <button
              onClick={() => setPreviewAd(ad)}
              className={cn(
                "flex-shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors",
                muted && "opacity-60"
              )}
              title="Ver preview del anuncio"
            >
              {ad.objectType === "VIDEO" ? (
                <Video className="size-3.5" />
              ) : (
                <ImageIcon className="size-3.5" />
              )}
            </button>
          )}
          <span className={cn("text-[13px] font-medium truncate block", muted && "text-muted-foreground")} title={ad.adName}>
            {ad.adName}
          </span>
        </div>
      </td>
      <td className={cn(tdClass, "px-2")}>
        <span className="text-[13px] text-muted-foreground truncate block" title={ad.adsetName}>
          {ad.adsetName || "-"}
        </span>
      </td>
      <td className={cn(tdClass, "px-2")}>
        <span className="text-[13px] text-muted-foreground truncate block" title={ad.campaignName}>
          {ad.campaignName || "-"}
        </span>
      </td>
      <td className={cn(tdClass, "text-center px-2")}>
        <Badge variant="outline" className={cn("text-[10px] font-semibold border", ctrBadge.className)}>
          {ad.ctr.toFixed(2)}%
        </Badge>
      </td>
      <td className={cn(tdClass, "text-center px-2")}>
        {ad.results > 0 ? (
          <Badge variant="outline" className="text-[10px] font-semibold border bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25">
            {ad.results}
          </Badge>
        ) : (
          <span className="text-[13px] text-muted-foreground/50">—</span>
        )}
      </td>
      <td className={cn(tdClass, "text-center text-muted-foreground text-[13px] px-2")}>
        {ad.results > 0 ? formatMoney(ad.costPerResult || ad.spend / ad.results) : <span className="text-muted-foreground/50">—</span>}
      </td>
      <td className={cn(tdClass, "text-center text-muted-foreground text-[13px] px-2")}>
        {ad.impressions.toLocaleString("es-AR")}
      </td>
      <td className={cn(tdClass, "text-center text-muted-foreground text-[13px] px-2")}>
        {formatMoney(ad.spend)}
      </td>
      <td className={cn(tdClass, "text-center text-muted-foreground text-[13px] px-2")}>
        {formatShortDate(ad.createdAt)}
      </td>
      {showActive && (
        <td className={cn(tdClass, "text-center text-[13px] px-2")}>
          {formatDaysActive(ad.createdAt)}
        </td>
      )}
    </tr>
  );
}

export function ActiveAdsCard({ activeAds, inactiveAds, isLoading }: ActiveAdsCardProps) {
  const { formatMoney } = useCurrency();
  const [previewAd, setPreviewAd] = useState<MetaActiveAd | null>(null);
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const { activeProfileId } = useBusinessProfile();
  const [statusView, setStatusView] = useState<"activos" | "inactivos">("activos");

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

  const isVideo = previewAd?.objectType === "VIDEO";
  const showActive = statusView === "activos";
  const currentAds = statusView === "activos"
    ? [...activeAds].sort((a, b) => b.ctr - a.ctr)
    : [...inactiveAds].sort((a, b) => b.spend - a.spend);

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardContent className="px-5 py-4 flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="w-full h-8 border-b border-border mb-3 flex">
          <button
            className={cn(
              "flex-1 text-xs px-3 border-b-2 transition-colors",
              statusView === "activos"
                ? "border-b-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
            )}
            onClick={() => setStatusView("activos")}
          >
            Activos ({activeAds.length})
          </button>
          <button
            className={cn(
              "flex-1 text-xs px-3 border-b-2 transition-colors",
              statusView === "inactivos"
                ? "border-b-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground/60 hover:text-muted-foreground"
            )}
            onClick={() => setStatusView("inactivos")}
          >
            Inactivos ({inactiveAds.length})
          </button>
        </div>

        {/* Table header */}
        <table className="w-full text-sm table-fixed">
          <ColGroup showActive={showActive} />
          <thead>
            <tr className="border-b border-border/30">
              <th className={cn(thClass, "text-left px-2")}>Anuncio</th>
              <th className={cn(thClass, "text-left px-2")}>Conjunto</th>
              <th className={cn(thClass, "text-left px-2")}>Campaña</th>
              <th className={cn(thClass, "text-center px-2")}>CTR</th>
              <th className={cn(thClass, "text-center px-2")}>Resultados</th>
              <th className={cn(thClass, "text-center px-2")}>Costo x Res.</th>
              <th className={cn(thClass, "text-center px-2")}>Impr.</th>
              <th className={cn(thClass, "text-center px-2")}>Gasto</th>
              <th className={cn(thClass, "text-center px-2")}>Creado</th>
              {showActive && <th className={cn(thClass, "text-center px-2")}>Activo</th>}
            </tr>
          </thead>
        </table>

        {/* SCROLLABLE: Only the rows */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {currentAds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {statusView === "activos" ? "No se encontraron anuncios activos" : "No se encontraron anuncios inactivos en este periodo"}
            </p>
          ) : (
            <table className="w-full text-sm table-fixed">
              <ColGroup showActive={showActive} />
              <tbody>
                {currentAds.map((ad) => (
                  <AdsRow
                    key={ad.adId}
                    ad={ad}
                    muted={statusView === "inactivos"}
                    showActive={showActive}
                    setPreviewAd={setPreviewAd}
                    formatMoney={formatMoney}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>

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
    </Card>
  );
}
