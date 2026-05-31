"use client";

import { useEffect, useState, use, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { GuestUpload } from "@/components/upload/guest-upload";
import { PhotoGallery } from "@/components/gallery/photo-gallery";
import { RichTextDisplay } from "@/components/editor/rich-text-editor";
import { Skeleton } from "@/components/ui/skeleton";

type PublicEvent = {
  id: string;
  slug: string;
  eventName: string;
  eventDescription: string;
  coverImageUrl: string | null;
  uploadEnabled: boolean;
  allowGuestsToViewPhotos: boolean;
  allowGuestsToDownloadPhotos: boolean;
  isExpired: boolean;
  photoCount: number;
};

export default function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [galleryKey, setGalleryKey] = useState(0);

  const load = useCallback(() => {
    fetch(`/api/events/public/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setEvent);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white p-4">
        <Skeleton className="mx-auto mt-12 h-64 max-w-3xl rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-violet-50/40 via-white to-white">
      <header className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-6">
        <Camera className="h-6 w-6 text-violet-600" />
        <span className="font-semibold text-violet-700">KlikMoment</span>
      </header>

      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-3xl px-4 pb-16"
      >
        {event.coverImageUrl && (
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-3xl shadow-xl">
            <Image
              src={event.coverImageUrl}
              alt="Event cover"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        <RichTextDisplay
          html={event.eventName}
          className="text-center text-3xl font-bold sm:text-4xl"
        />

        {event.eventDescription && (
          <RichTextDisplay
            html={event.eventDescription}
            className="mt-4 text-center text-slate-600"
          />
        )}

        {event.isExpired && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-center text-sm text-amber-800">
            This event has ended. Uploads are disabled.
          </p>
        )}

        <section className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">Share your photos</h2>
          <GuestUpload
            slug={slug}
            disabled={!event.uploadEnabled}
            onUploaded={() => {
              setGalleryKey((k) => k + 1);
              load();
            }}
          />
        </section>

        {event.allowGuestsToViewPhotos && (
          <section className="mt-12">
            <h2 className="mb-6 text-xl font-semibold text-slate-900">
              Gallery ({event.photoCount})
            </h2>
            <PhotoGallery
              key={galleryKey}
              eventId={event.id}
              slug={slug}
              canDownload={event.allowGuestsToDownloadPhotos}
            />
          </section>
        )}
      </motion.div>
    </div>
  );
}
