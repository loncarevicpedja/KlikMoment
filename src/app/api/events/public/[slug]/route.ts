import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/lib/repositories/event-repository";
import { photoRepository } from "@/lib/repositories/photo-repository";
import { coverStorageKey, mediaUrl } from "@/lib/media-url";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const event = await eventRepository.findBySlug(slug);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photoCount = await photoRepository.countByEvent(event.id, {
    hideLikedFromGuests: true,
  });

  return NextResponse.json({
    id: event.id,
    slug: event.slug,
    eventName: event.eventName,
    eventDescription: event.eventDescription,
    coverImageUrl: event.coverImageUrl
      ? mediaUrl(coverStorageKey(event.folderName))
      : null,
    uploadEnabled: event.uploadEnabled && !event.isExpired,
    allowGuestsToViewPhotos: event.allowGuestsToViewPhotos,
    allowGuestsToDownloadPhotos: event.allowGuestsToDownloadPhotos,
    isExpired: event.isExpired,
    photoCount,
  });
}
