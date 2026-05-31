import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { eventRepository } from "@/lib/repositories/event-repository";
import { getObjectStream } from "@/lib/r2";
import { photoRepository } from "@/lib/repositories/photo-repository";
import { createPhotosZipStream } from "@/lib/services/zip-service";
import { photoIdsSchema } from "@/lib/validations/photo";
import { canManageEvent } from "@/lib/auth/permissions";

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function photoFilename(
  id: string,
  mimeType: string,
  authorName?: string | null
): string {
  const ext = MIME_EXT[mimeType] ?? "jpg";
  const prefix = authorName?.trim().replace(/[^\w.-]+/g, "_") || "photo";
  return `${prefix}-${id.slice(0, 8)}.${ext}`;
}

export async function GET(req: NextRequest) {
  const photoId = req.nextUrl.searchParams.get("photoId");
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!photoId || !eventId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const event = await eventRepository.findById(eventId);
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  const isManager = canManageEvent(session, event);

  if (!isManager && !event.allowGuestsToDownloadPhotos) {
    return NextResponse.json({ error: "Downloads disabled" }, { status: 403 });
  }

  const photo = await photoRepository.findById(photoId);
  if (!photo || photo.eventId !== eventId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isManager && photo.likedByOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await getObjectStream(photo.storageKey);
  if (!body) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filename = photoFilename(photo.id, photo.mimeType, photo.authorName);
  const webStream = Readable.toWeb(body as Readable) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...(photo.sizeBytes ? { "Content-Length": String(photo.sizeBytes) } : {}),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = photoIdsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { eventId, photoIds } = parsed.data;
    const event = await eventRepository.findById(eventId);

    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await auth();
    const isManager = canManageEvent(session, event);

    if (!isManager && !event.allowGuestsToDownloadPhotos) {
      return NextResponse.json({ error: "Downloads disabled" }, { status: 403 });
    }

    const stream = await createPhotosZipStream(eventId, photoIds);
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="photos-${event.slug}.zip"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
