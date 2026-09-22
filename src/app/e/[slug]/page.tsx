"use client";

import { useEffect, useState, use, useCallback } from "react";
import { motion } from "framer-motion";
import { sr } from "@/content/sr";
import { BrandLogo } from "@/components/brand/brand-logo";
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
  pending?: boolean;
  message?: string;
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
      <div className="min-h-screen bg-[#FAF7F2] p-4">
        <Skeleton className="mx-auto mt-12 h-64 max-w-3xl rounded-3xl" />
      </div>
    );
  }

  if (event.pending) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4FAF6] px-4 text-center">
        <BrandLogo size="md" className="mb-6" />
        <h1 className="text-2xl font-bold text-[#0F1F17]">{sr.guest.pendingTitle}</h1>
        <p className="mt-3 max-w-md text-[#5C6B63]">{sr.guest.pendingBody}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4FAF6]">
      <header className="sticky top-0 z-50 border-b border-[#D1E7D9] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4">
          <BrandLogo size="sm" />
        </div>
      </header>

      {event.coverImageUrl && (
        <div className="mb-8 px-4">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-slate-100/60 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImageUrl}
              alt="Naslovna"
              className="mx-auto block h-auto max-h-[min(85vh,900px)] w-full object-contain"
            />
          </div>
        </div>
      )}

      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-3xl px-4 pb-16"
      >
        <RichTextDisplay
          html={event.eventName}
          className="text-center font-serif text-3xl font-bold sm:text-4xl"
        />

        {event.eventDescription && (
          <RichTextDisplay
            html={event.eventDescription}
            className="mt-4 text-center text-[#6B6560]"
          />
        )}

        {event.isExpired && (
          <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-center text-sm text-amber-800">
            {sr.guest.eventEnded}
          </p>
        )}

        <section className="mt-10 rounded-3xl border border-[#E8D5CE]/80 bg-white p-6 shadow-xl sm:p-8">
          <h2 className="mb-6 text-xl font-semibold">{sr.guest.sharePhotos}</h2>
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
            <h2 className="mb-6 text-xl font-semibold">
              {sr.guest.gallery} ({event.photoCount})
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
