import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eventRepository } from "@/lib/repositories/event-repository";
import { photoRepository } from "@/lib/repositories/photo-repository";
import { canManageEvent } from "@/lib/auth/permissions";
import { mediaUrl } from "@/lib/media-url";

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("eventId");
  const slug = req.nextUrl.searchParams.get("slug");

  if (!eventId && !slug) {
    return NextResponse.json({ error: "eventId or slug required" }, { status: 400 });
  }

  let event;
  if (slug) {
    event = await eventRepository.findBySlug(slug);
  } else {
    event = await eventRepository.findById(eventId!);
  }

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  const isManager = canManageEvent(session, event);

  if (!isManager && !event.allowGuestsToViewPhotos) {
    return NextResponse.json({ error: "Gallery hidden" }, { status: 403 });
  }

  const likedOnly = isManager && req.nextUrl.searchParams.get("liked") === "1";

  const photos = await photoRepository.findByEvent(event.id, {
    likedOnly,
    hideLikedFromGuests: !isManager,
  });

  return NextResponse.json(
    photos.map((p) => ({
      id: p.id,
      publicUrl: mediaUrl(p.storageKey),
      authorName: p.authorName,
      mimeType: p.mimeType,
      ...(isManager ? { likedByOwner: p.likedByOwner } : {}),
      createdAt: p.createdAt,
      width: p.width,
      height: p.height,
    }))
  );
}
