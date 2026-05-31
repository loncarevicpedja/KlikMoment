"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlobFile } from "@/lib/download-photo";

type QrViewerProps = {
  eventId: string;
  slug: string;
  onClose: () => void;
};

export function QrViewer({ eventId, slug, onClose }: QrViewerProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    fetch(`/api/events/${eventId}/qr`)
      .then((r) => r.blob())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [eventId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleDownload = async () => {
    const res = await fetch(`/api/events/${eventId}/qr`);
    if (!res.ok) return;
    const blob = await res.blob();
    await downloadBlobFile(blob, `qr-${slug}.png`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="QR code"
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <p className="text-sm font-medium text-white">QR Code</p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => void handleDownload()}
            aria-label="Download QR code"
          >
            <Download className="h-5 w-5" />
          </Button>
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

      <div className="flex flex-1 items-center justify-center p-6">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Event QR code"
            className="max-h-[70vh] max-w-full rounded-2xl bg-white p-4 shadow-2xl"
          />
        ) : (
          <div className="h-64 w-64 animate-pulse rounded-2xl bg-white/10" />
        )}
      </div>
    </div>
  );
}
