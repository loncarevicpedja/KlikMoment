import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { eventRepository } from "@/lib/repositories/event-repository";
import { updateEvent } from "@/lib/services/event-service";
import { buildCoverKey, getPublicUrl, uploadToR2 } from "@/lib/r2";
import { canManageEvent } from "@/lib/auth/permissions";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_IMAGE_SIZE } from "@/lib/validations/photo";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();

  const event = await eventRepository.findById(id);
  if (!event) {
    return NextResponse.json({ error: "Nije pronađeno" }, { status: 404 });
  }

  if (!canManageEvent(session, event)) {
    return NextResponse.json({ error: "Nemate dozvolu" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Fajl nije izabran" }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return NextResponse.json({ error: "Nepodržan format" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Fajl je prevelik" }, { status: 400 });
  }

  const optimized = await sharp(buffer)
    .resize(2400, 2400, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const key = buildCoverKey(event.folderName, "webp");
  await uploadToR2(key, optimized, "image/webp");
  const coverImageUrl = getPublicUrl(key);

  const updated = await updateEvent(id, { coverImageUrl });
  return NextResponse.json(updated);
}
