import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/lib/repositories/event-repository";
import { uploadPhoto } from "@/lib/services/photo-service";
import { rateLimit } from "@/lib/rate-limit";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/validations/photo";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const limit = rateLimit(`upload:${ip}`, 30, 60_000);

  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const slug = formData.get("slug") as string;
    const authorName = (formData.get("authorName") as string) || undefined;
    const file = formData.get("file") as File | null;

    if (!slug || !file) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const event = await eventRepository.findBySlug(slug);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const photo = await uploadPhoto({
      eventId: event.id,
      buffer,
      mimeType: file.type,
      authorName,
    });

    return NextResponse.json({
      id: photo.id,
      publicUrl: photo.publicUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
