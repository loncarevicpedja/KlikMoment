import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eventRepository } from "@/lib/repositories/event-repository";
import { registerUploadedMedia } from "@/lib/services/photo-service";
import { rateLimit } from "@/lib/rate-limit";

const completeBodySchema = z.object({
  slug: z.string().min(1),
  mediaId: z.string().uuid(),
  storageKey: z.string().min(1),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  authorName: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const limit = rateLimit(`upload-complete:${ip}`, 60, 60_000);

  if (!limit.success) {
    return NextResponse.json({ error: "Previše zahteva" }, { status: 429 });
  }

  try {
    const body = completeBodySchema.parse(await req.json());
    const event = await eventRepository.findBySlug(body.slug);

    if (!event) {
      return NextResponse.json({ error: "Događaj nije pronađen" }, { status: 404 });
    }

    const photo = await registerUploadedMedia({
      eventId: event.id,
      mediaId: body.mediaId,
      storageKey: body.storageKey,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      authorName: body.authorName,
    });

    return NextResponse.json({ id: photo.id, publicUrl: photo.publicUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Slanje nije uspelo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
