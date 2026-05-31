import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const guestUploadSchema = z.object({
  authorName: z.string().max(100).optional(),
  eventSlug: z.string().min(1),
});

export const photoIdsSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1),
  eventId: z.string().uuid(),
});
