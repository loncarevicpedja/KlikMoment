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
import { packageAllowsVideo } from "@/lib/packages";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  isVideoMime,
} from "@/lib/validations/photo";

const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const VIDEO_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

async function assertUploadAllowed(eventId: string, bufferLength: number) {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new Error("Događaj nije pronađen");
  if (event.status !== "ACTIVE") throw new Error("Slanje medija nije dostupno");
  if (event.isExpired || !event.uploadEnabled) {
    throw new Error("Slanje medija je isključeno za ovaj događaj");
  }

  const usedBytes = await eventRepository.getStorageUsedBytes(eventId);
  const limitBytes = event.storageLimitGB * 1024 * 1024 * 1024;
  if (usedBytes + bufferLength > limitBytes) {
    throw new Error("Dostignut limit prostora");
  }

  return event;
}

export async function uploadPhoto(params: {
  eventId: string;
  buffer: Buffer;
  mimeType: string;
  authorName?: string;
}) {
  const { eventId, buffer, mimeType, authorName } = params;

  if (
    !ALLOWED_IMAGE_MIME_TYPES.includes(
      mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
    )
  ) {
    throw new Error("Nepodržan format slike");
  }

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error("Fajl je prevelik");
  }

  await assertUploadAllowed(eventId, buffer.length);

  const event = await eventRepository.findById(eventId);
  if (!event) throw new Error("Događaj nije pronađen");

  const metadata = await sharp(buffer).metadata();
  const extension = IMAGE_EXT[mimeType] ?? "jpg";
  const photoId = randomUUID();
  const storageKey = buildPhotoKey(event.folderName, photoId, extension);

  await uploadToR2(storageKey, buffer, mimeType);

  return photoRepository.create({
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
}

export async function registerUploadedMedia(params: {
  eventId: string;
  mediaId: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  authorName?: string;
}) {
  const { eventId, mediaId, storageKey, mimeType, sizeBytes, authorName } =
    params;

  if (isVideoMime(mimeType)) {
    if (
      !ALLOWED_VIDEO_MIME_TYPES.includes(
        mimeType as (typeof ALLOWED_VIDEO_MIME_TYPES)[number]
      )
    ) {
      throw new Error("Nepodržan video format");
    }
    if (sizeBytes > MAX_VIDEO_SIZE) throw new Error("Video je prevelik");
  } else {
    throw new Error("Nepodržan format");
  }

  const event = await assertUploadAllowed(eventId, sizeBytes);
  if (!packageAllowsVideo(event.packageId)) {
    throw new Error("Video nije uključen u vaš paket");
  }

  const extension = VIDEO_EXT[mimeType] ?? "mp4";

  return photoRepository.create({
    id: mediaId,
    event: { connect: { id: eventId } },
    storageKey,
    publicUrl: getPublicUrl(storageKey),
    authorName: authorName?.trim() || null,
    mimeType,
    sizeBytes,
    width: null,
    height: null,
  });
}

export async function deletePhoto(photoId: string, eventId: string) {
  const photo = await photoRepository.findById(photoId);
  if (!photo || photo.eventId !== eventId) {
    throw new Error("Foto nije pronađeno");
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

export function buildMediaKey(
  folderName: string,
  mediaId: string,
  mimeType: string
) {
  const ext = isVideoMime(mimeType)
    ? (VIDEO_EXT[mimeType] ?? "mp4")
    : (IMAGE_EXT[mimeType] ?? "jpg");
  return buildPhotoKey(folderName, mediaId, ext);
}
