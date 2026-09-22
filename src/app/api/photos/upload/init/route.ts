import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eventRepository } from "@/lib/repositories/event-repository";
import {
  buildMediaKey,
  registerUploadedMedia,
  uploadPhoto,
} from "@/lib/services/photo-service";
import { getPresignedUploadUrl } from "@/lib/r2";
import { rateLimit } from "@/lib/rate-limit";
import { packageAllowsVideo } from "@/lib/packages";
import {
  ALLOWED_MIME_TYPES,
  isVideoMime,
  maxSizeForMime,
  uploadInitSchema,
} from "@/lib/validations/photo";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const limit = rateLimit(`upload-init:${ip}`, 60, 60_000);

  if (!limit.success) {
    return NextResponse.json({ error: "Previše zahteva" }, { status: 429 });
  }

  try {
    const body = uploadInitSchema.parse(await req.json());
    const event = await eventRepository.findBySlug(body.slug);

    if (!event) {
      return NextResponse.json({ error: "Događaj nije pronađen" }, { status: 404 });
    }

    if (
      !ALLOWED_MIME_TYPES.includes(
        body.mimeType as (typeof ALLOWED_MIME_TYPES)[number]
      )
    ) {
      return NextResponse.json({ error: "Nepodržan format" }, { status: 400 });
    }

    if (isVideoMime(body.mimeType) && !packageAllowsVideo(event.packageId)) {
      return NextResponse.json(
        { error: "Video nije uključen u paket" },
        { status: 400 }
      );
    }

    if (body.sizeBytes > maxSizeForMime(body.mimeType)) {
      return NextResponse.json({ error: "Fajl je prevelik" }, { status: 400 });
    }

    const mediaId = randomUUID();
    const storageKey = buildMediaKey(event.folderName, mediaId, body.mimeType);
    const uploadUrl = await getPresignedUploadUrl(storageKey, body.mimeType);

    return NextResponse.json({ mediaId, storageKey, uploadUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Greška";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
