"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Download, Heart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadPhotoFile, photoFilename } from "@/lib/download-photo";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type PhotoItem = {
  id: string;
  publicUrl: string;
  authorName?: string | null;
  mimeType?: string;
  likedByOwner?: boolean;
  createdAt: string;
  width?: number | null;
  height?: number | null;
};

type PhotoCardProps = {
  photo: PhotoItem;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  showSelect?: boolean;
  canDownload?: boolean;
  canDelete?: boolean;
  canLike?: boolean;
  showLikeStatus?: boolean;
  onLike?: (id: string, liked: boolean) => void;
  onDelete?: (id: string) => void;
  onOpen?: () => void;
  eventId: string;
};

export function PhotoCard({
  photo,
  selected,
  onSelect,
  showSelect,
  canDownload,
  canDelete,
  canLike,
  showLikeStatus,
  onLike,
  onDelete,
  onOpen,
  eventId,
}: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await downloadPhotoFile({
      photoId: photo.id,
      eventId,
      filename: photoFilename(photo.id, photo.mimeType, photo.authorName),
    });
    if (ok) toast.success("Photo saved");
    else toast.error("Download failed");
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.(photo.id, !photo.likedByOwner);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-md ring-1 transition hover:shadow-xl",
        showLikeStatus && photo.likedByOwner
          ? "ring-rose-300/80"
          : "ring-slate-200/60"
      )}
    >
      {showSelect && (
        <div className="absolute left-3 top-3 z-10">
          <Checkbox
            checked={selected}
            onCheckedChange={(c) => onSelect?.(photo.id, !!c)}
          />
        </div>
      )}

      {showLikeStatus && photo.likedByOwner && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm">
          <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
        </div>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="relative block w-full cursor-zoom-in bg-slate-100 text-left"
        aria-label="View full size"
      >
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 to-slate-200" />
        )}
        <Image
          src={photo.publicUrl}
          alt={photo.authorName ?? "Event photo"}
          width={photo.width ?? 600}
          height={photo.height ?? 800}
          className={cn(
            "h-auto w-full object-cover transition duration-500",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </button>

      <div className="flex items-center justify-between gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">
            {photo.authorName || "Anonymous"}
          </p>
          <p className="text-xs text-slate-500">{formatDate(photo.createdAt)}</p>
        </div>
        <div className="flex shrink-0 gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          {canLike && onLike && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              aria-label={photo.likedByOwner ? "Unlike photo" : "Like photo"}
              className={photo.likedByOwner ? "text-rose-500 hover:text-rose-600" : ""}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  photo.likedByOwner && "fill-current"
                )}
              />
            </Button>
          )}
          {canDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              aria-label="Download photo"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(photo.id)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
