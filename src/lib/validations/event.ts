import { z } from "zod";

export const eventFormSchema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  eventDescription: z.string().optional().default(""),
  ownerEmail: z.string().email("Valid owner email required"),
  storageLimitGB: z.coerce.number().min(0.5).max(500),
  activeDays: z.coerce.number().int().min(1).max(365),
  uploadEnabled: z.boolean().default(true),
  viewEnabled: z.boolean().default(true),
  allowGuestsToViewPhotos: z.boolean().default(false),
  allowGuestsToDownloadPhotos: z.boolean().default(false),
});

export type EventFormInput = z.infer<typeof eventFormSchema>;

export const eventUpdateSchema = eventFormSchema.partial().extend({
  id: z.string().uuid(),
  endDate: z.coerce.date().optional(),
  isExpired: z.boolean().optional(),
  uploadEnabled: z.boolean().optional(),
  viewEnabled: z.boolean().optional(),
});
