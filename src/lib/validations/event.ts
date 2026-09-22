import { z } from "zod";

export const eventFormSchema = z.object({
  eventName: z.string().min(1, "Naziv događaja je obavezan"),
  eventDescription: z.string().optional().default(""),
  ownerEmail: z.string().email("Unesite ispravan email vlasnika"),
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
