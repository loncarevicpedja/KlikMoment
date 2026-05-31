"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Download, Heart, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadPhotoFile, photoFilename } from "@/lib/download-photo";
import { cn } from "@/lib/utils";
import type { PhotoItem } from "./photo-card";

type PhotoLightboxProps = {
  photos: PhotoItem[];
  index: number;
  eventId: string;
  canDownload?: boolean;
  canLike?: boolean;
  onLike?: (id: string, liked: boolean) => void;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export function PhotoLightbox({
  photos,
  index,
  eventId,
  canDownload,
  canLike,
  onLike,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onNavigate(index - 1);
  }, [hasPrev, index, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext) onNavigate(index + 1);
  }, [hasNext, index, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, goPrev, goNext]);

  if (!photo) return null;

  const handleDownload = async () => {
    const ok = await downloadPhotoFile({
      photoId: photo.id,
      eventId,
      filename: photoFilename(photo.id, photo.mimeType, photo.authorName),
    });
    if (!ok) toast.error("Download failed");
  };

  const authorLabel = photo.authorName?.trim() || null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Photo preview"
    >
      {/* Top bar */}
      <div
        className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="min-w-0 truncate text-sm font-medium text-white sm:text-base">
          {authorLabel ?? (
            <span className="text-white/50">Anonymous</span>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {canDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => void handleDownload()}
              aria-label="Download photo"
            >
              <Download className="h-5 w-5" />
            </Button>
          )}
          {canLike && onLike && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => onLike(photo.id, !photo.likedByOwner)}
              aria-label={photo.likedByOwner ? "Unlike photo" : "Like photo"}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  photo.likedByOwner && "fill-rose-500 text-rose-500"
                )}
              />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Image + navigation overlaid */}
      <div className="relative min-h-0 flex-1 px-1 sm:px-2">
        <div
          className="relative h-full w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={photo.publicUrl}
            alt={photo.authorName ?? "Event photo"}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-2 top-1/2 z-10 h-11 w-11 -translate-y-1/2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 sm:left-4 sm:h-12 sm:w-12",
              !hasPrev && "pointer-events-none opacity-30"
            )}
            onClick={goPrev}
            disabled={!hasPrev}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-2 top-1/2 z-10 h-11 w-11 -translate-y-1/2 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 sm:right-4 sm:h-12 sm:w-12",
              !hasNext && "pointer-events-none opacity-30"
            )}
            onClick={goNext}
            disabled={!hasNext}
            aria-label="Next photo"
          >
            <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" />
          </Button>
        </div>
      </div>

      <p className="shrink-0 pb-4 text-center text-xs text-white/60">
        {index + 1} / {photos.length}
      </p>
    </div>
  );
}
