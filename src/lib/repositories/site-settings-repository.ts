import { prisma } from "@/lib/prisma";

export const siteSettingsRepository = {
  async get() {
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "default" } });
    }
    return settings;
  },

  update(data: {
    paymentBankName?: string | null;
    paymentAccountHolder?: string | null;
    paymentAccountNumber?: string | null;
    paymentInstructions?: string | null;
    paymentReferenceTpl?: string;
  }) {
    return prisma.siteSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    });
  },
};

export function formatPaymentReference(tpl: string, eventId: string) {
  return tpl.replace("{eventId}", eventId);
}
