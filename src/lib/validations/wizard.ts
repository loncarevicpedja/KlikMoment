import { z } from "zod";

export const wizardStep1Schema = z.object({
  eventName: z.string().min(2, "Unesite naziv događaja"),
  category: z.enum(["WEDDING", "BIRTHDAY", "CORPORATE", "CHRISTENING"]),
  eventDate: z.string().min(1, "Izaberite datum"),
  location: z.string().optional(),
  eventDescription: z.string().optional(),
});

export const wizardStep2Schema = z.object({
  ownerName: z.string().min(2, "Unesite ime i prezime"),
  ownerEmail: z.string().email("Unesite ispravan email"),
  ownerPhone: z.string().min(6, "Unesite telefon"),
  packageId: z.enum(["basic", "premium", "pro"]),
});

export type WizardStep1 = z.infer<typeof wizardStep1Schema>;
export type WizardStep2 = z.infer<typeof wizardStep2Schema>;
