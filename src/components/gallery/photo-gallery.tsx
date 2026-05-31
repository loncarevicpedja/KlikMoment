"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Heart, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PhotoCard, type PhotoItem } from "./photo-card";
import { PhotoLightbox } from "./photo-lightbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadBlobFile } from "@/lib/download-photo";
import { cn } from "@/lib/utils";

type PhotoGalleryProps = {
  eventId: string;
  slug?: string;
  canDownload?: boolean;
  canDelete?: boolean;
  canLike?: boolean;
  showSelect?: boolean;
  showLikedFilter?: boolean;
};

export function PhotoGallery({
  eventId,
  slug,
  canDownload = false,
  canDelete = false,
  canLike = false,
  showSelect = false,
  showLikedFilter = false,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [likedOnly, setLikedOnly] = useState(false);
  const [hasLikedPhotos, setHasLikedPhotos] = useState(false);

  const showLikedButton = showLikedFilter && hasLikedPhotos;

  const fetchPhotos = useCallback(async () => {
    const params = new URLSearchParams();
    if (slug) params.set("slug", slug);
    else params.set("eventId", eventId);
    if (likedOnly) params.set("liked", "1");

    const res = await fetch(`/api/photos?${params}`);
    if (!res.ok) {
      setPhotos([]);
      setHasLikedPhotos(false);
      setLoading(false);
      return;
    }
    const data: PhotoItem[] = await res.json();
    setPhotos(data);
    setHasLikedPhotos(
      likedOnly ? data.length > 0 : data.some((p) => p.likedByOwner)
    );
    setLoading(false);
  }, [eventId, slug, likedOnly]);

  useEffect(() => {
    setLoading(true);
    void fetchPhotos();
  }, [fetchPhotos]);

  const handleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleLike = async (id: string, liked: boolean) => {
    const res = await fetch(`/api/photos/${id}/like?eventId=${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked }),
    });

    if (!res.ok) {
      toast.error("Failed to update like");
      return;
    }

    setPhotos((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, likedByOwner: liked } : p
      );
      const filtered = likedOnly ? next.filter((p) => p.likedByOwner) : next;
      setHasLikedPhotos(
        likedOnly ? filtered.length > 0 : filtered.some((p) => p.likedByOwner)
      );
      if (likedOnly && filtered.length === 0) {
        setLikedOnly(false);
      }
      return filtered;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/photos/${id}?eventId=${eventId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPhotos((p) => {
        const next = p.filter((x) => x.id !== id);
        setHasLikedPhotos(next.some((x) => x.likedByOwner));
        if (likedOnly && next.length === 0) {
          setLikedOnly(false);
        }
        setLightboxIndex((current) => {
          if (current === null) return null;
          if (!next.length) return null;
          return Math.min(current, next.length - 1);
        });
        return next;
      });
      toast.success("Photo deleted");
    } else {
      toast.error("Failed to delete");
    }
  };

  const downloadSelected = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return toast.error("Select photos first");

    const res = await fetch("/api/photos/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, photoIds: ids }),
    });

    if (!res.ok) return toast.error("Download failed");

    const blob = await res.blob();
    await downloadBlobFile(blob, "selected-photos.zip");
    toast.success("ZIP downloaded");
  };

  const downloadAll = async () => {
    const res = await fetch(`/api/photos/download-all?eventId=${eventId}`);
    if (!res.ok) return toast.error("Download failed");

    const blob = await res.blob();
    await downloadBlobFile(blob, "all-photos.zip");
    toast.success("ZIP downloaded");
  };

  if (loading) {
    return (
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-4 h-64 w-full" />
        ))}
      </div>
    );
  }

  if (!photos.length) {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center"
        >
          <ImageIcon className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700">
            {likedOnly ? "No liked photos yet" : "No photos yet"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {likedOnly
              ? "Tap the heart on photos you love."
              : "Be the first to share a moment!"}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {showLikedButton && (
          <Button
            variant={likedOnly ? "default" : "secondary"}
            size="sm"
            onClick={() => setLikedOnly((v) => !v)}
          >
            <Heart className={cn("h-4 w-4", likedOnly && "fill-current")} />
            {likedOnly ? "Showing liked" : "Show liked only"}
          </Button>
        )}
        {(canDownload || canDelete) && showSelect && canDownload && (
          <>
            <Button variant="secondary" size="sm" onClick={downloadSelected}>
              <Download className="h-4 w-4" />
              Selected ZIP
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadAll}>
              <Download className="h-4 w-4" />
              All ZIP
            </Button>
          </>
        )}
      </div>

      <div className="columns-1 gap-x-4 sm:columns-2 lg:columns-3">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              eventId={eventId}
              selected={selected.has(photo.id)}
              onSelect={handleSelect}
              showSelect={showSelect}
              canDownload={canDownload}
              canDelete={canDelete}
              canLike={canLike}
              showLikeStatus={canLike}
              onLike={handleLike}
              onDelete={handleDelete}
              onOpen={() => setLightboxIndex(index)}
            />
          ))}
        </AnimatePresence>
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          eventId={eventId}
          canDownload={canDownload}
          canLike={canLike}
          onLike={handleLike}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
