import { z } from "zod";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
] as const;

export const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export function isVideoMime(mime: string) {
  return (ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mime);
}

export function maxSizeForMime(mime: string) {
  return isVideoMime(mime) ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
}

export const guestUploadSchema = z.object({
  authorName: z.string().max(100).optional(),
  eventSlug: z.string().min(1),
});

export const uploadInitSchema = z.object({
  slug: z.string().min(1),
  mimeType: z.string(),
  sizeBytes: z.number().int().positive(),
  authorName: z.string().max(100).optional(),
});

export const uploadCompleteSchema = z.object({
  mediaId: z.string().uuid(),
  slug: z.string().min(1),
});

export const photoIdsSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1),
  eventId: z.string().uuid(),
});
