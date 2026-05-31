import sharp from "sharp";
import { randomUUID } from "crypto";
import { photoRepository } from "@/lib/repositories/photo-repository";
import { eventRepository } from "@/lib/repositories/event-repository";
import {
  buildPhotoKey,
  deleteFromR2,
  getPublicUrl,
  uploadToR2,
} from "@/lib/r2";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "@/lib/validations/photo";

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadPhoto(params: {
  eventId: string;
  buffer: Buffer;
  mimeType: string;
  authorName?: string;
}) {
  const { eventId, buffer, mimeType, authorName } = params;

  if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error("Invalid file type");
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("File too large");
  }

  const event = await eventRepository.findById(eventId);
  if (!event) throw new Error("Event not found");
  if (event.isExpired || !event.uploadEnabled) {
    throw new Error("Uploads are disabled for this event");
  }

  const usedBytes = await eventRepository.getStorageUsedBytes(eventId);
  const limitBytes = event.storageLimitGB * 1024 * 1024 * 1024;
  if (usedBytes + buffer.length > limitBytes) {
    throw new Error("Storage limit reached");
  }

  const metadata = await sharp(buffer).metadata();
  const extension = EXT_MAP[mimeType] ?? "jpg";
  const photoId = randomUUID();
  const storageKey = buildPhotoKey(event.folderName, photoId, extension);

  await uploadToR2(storageKey, buffer, mimeType);

  const photo = await photoRepository.create({
    id: photoId,
    event: { connect: { id: eventId } },
    storageKey,
    publicUrl: getPublicUrl(storageKey),
    authorName: authorName?.trim() || null,
    mimeType,
    sizeBytes: buffer.length,
    width: metadata.width,
    height: metadata.height,
  });

  return photo;
}

export async function deletePhoto(photoId: string, eventId: string) {
  const photo = await photoRepository.findById(photoId);
  if (!photo || photo.eventId !== eventId) {
    throw new Error("Photo not found");
  }

  await deleteFromR2(photo.storageKey);
  await photoRepository.delete(photoId);
}

export async function deletePhotos(photoIds: string[], eventId: string) {
  const photos = await photoRepository.findByIds(photoIds, eventId);
  await Promise.all(photos.map((p) => deleteFromR2(p.storageKey)));
  await photoRepository.deleteMany(
    photos.map((p) => p.id),
    eventId
  );
}
