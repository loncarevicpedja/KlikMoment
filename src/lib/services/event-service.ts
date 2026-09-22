import { addDays } from "date-fns";
import { customAlphabet } from "nanoid";
import type { EventCategory } from "@prisma/client";
import { Role } from "@prisma/client";
import { getPackage } from "@/content/packages";
import { eventRepository } from "@/lib/repositories/event-repository";
import { userRepository } from "@/lib/repositories/user-repository";
import {
  formatPaymentReference,
  siteSettingsRepository,
} from "@/lib/repositories/site-settings-repository";
import { sanitizeRichText, stripHtml } from "@/lib/sanitize";
import { generateFolderName, generateSecureSlug } from "@/lib/slug";
import {
  sendNewPendingOrderEmail,
  sendOwnerActivationEmail,
  sendPaymentInstructionsEmail,
} from "@/lib/email";
import { deleteFolderFromR2, uploadToR2, buildCoverKey, getPublicUrl } from "@/lib/r2";
import { applyPackageToEvent, type PackageId } from "@/lib/packages";
import type { EventFormInput } from "@/lib/validations/event";
import sharp from "sharp";

const activationToken = () =>
  customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 32)();

export type WizardOrderInput = {
  eventName: string;
  eventDescription: string;
  category: EventCategory;
  eventDate: Date;
  location?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  packageId: string;
  coverBuffer?: Buffer;
};

export async function createEvent(input: EventFormInput, baseUrl: string) {
  const slug = generateSecureSlug();
  const folderName = generateFolderName();
  const endDate = addDays(new Date(), input.activeDays);
  const ownerEmail = input.ownerEmail.toLowerCase();

  let owner = await userRepository.findByEmail(ownerEmail);
  const token = activationToken();
  const activationExpiry = addDays(new Date(), 7);

  if (!owner) {
    owner = await userRepository.create({
      email: ownerEmail,
      role: Role.OWNER,
      activated: false,
      activationToken: token,
      activationExpiry,
    });
  } else if (!owner.activated) {
    owner = await userRepository.update(owner.id, {
      activationToken: token,
      activationExpiry,
    });
  }

  const event = await eventRepository.create({
    slug,
    folderName,
    eventName: sanitizeRichText(input.eventName),
    eventDescription: sanitizeRichText(input.eventDescription ?? ""),
    ownerEmail,
    owner: { connect: { id: owner.id } },
    storageLimitGB: input.storageLimitGB,
    activeDays: input.activeDays,
    endDate,
    uploadEnabled: input.uploadEnabled,
    viewEnabled: input.viewEnabled,
    allowGuestsToViewPhotos: input.allowGuestsToViewPhotos,
    allowGuestsToDownloadPhotos: input.allowGuestsToDownloadPhotos,
    status: "ACTIVE",
    packageId: "basic",
  });

  let activationUrl: string | undefined;
  let emailSent: boolean | undefined;

  if (!owner.activated && owner.activationToken) {
    activationUrl = `${baseUrl}/activate/${owner.activationToken}`;
    emailSent = await sendOwnerActivationEmail({
      to: ownerEmail,
      eventName: stripHtml(input.eventName),
      activationUrl,
    });
  }

  return { event, activationUrl, emailSent };
}

export async function createPendingOrder(
  input: WizardOrderInput,
  baseUrl: string
) {
  const pkg = getPackage(input.packageId);
  const pkgDefaults = applyPackageToEvent(pkg.id as PackageId);
  const slug = generateSecureSlug();
  const folderName = generateFolderName();
  const endDate = addDays(input.eventDate, pkgDefaults.activeDays);
  const ownerEmail = input.ownerEmail.toLowerCase();

  let owner = await userRepository.findByEmail(ownerEmail);
  const token = activationToken();
  const activationExpiry = addDays(new Date(), 7);

  if (!owner) {
    owner = await userRepository.create({
      email: ownerEmail,
      name: input.ownerName,
      role: Role.OWNER,
      activated: false,
      activationToken: token,
      activationExpiry,
    });
  } else {
    owner = await userRepository.update(owner.id, {
      name: input.ownerName || owner.name,
      ...(!owner.activated
        ? { activationToken: token, activationExpiry }
        : {}),
    });
  }

  const event = await eventRepository.create({
    slug,
    folderName,
    eventName: sanitizeRichText(`<p>${input.eventName}</p>`),
    eventDescription: sanitizeRichText(
      input.eventDescription
        ? `<p>${input.eventDescription}</p>`
        : "<p></p>"
    ),
    ownerEmail,
    ownerPhone: input.ownerPhone,
    owner: { connect: { id: owner.id } },
    category: input.category,
    location: input.location ?? null,
    packageId: pkg.id,
    startDate: input.eventDate,
    endDate,
    storageLimitGB: pkgDefaults.storageLimitGB,
    activeDays: pkgDefaults.activeDays,
    status: "PENDING",
    uploadEnabled: false,
    viewEnabled: false,
    allowGuestsToViewPhotos: false,
    allowGuestsToDownloadPhotos: false,
  });

  if (input.coverBuffer) {
    const optimized = await sharp(input.coverBuffer)
      .resize(2400, 2400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const key = buildCoverKey(folderName, "webp");
    await uploadToR2(key, optimized, "image/webp");
    await eventRepository.update(event.id, {
      coverImageUrl: getPublicUrl(key),
    });
  }

  const settings = await siteSettingsRepository.get();
  const reference = formatPaymentReference(
    settings.paymentReferenceTpl,
    event.id
  );

  await sendPaymentInstructionsEmail({
    to: ownerEmail,
    ownerName: input.ownerName,
    eventName: input.eventName,
    packageName: pkg.name,
    priceRsd: pkg.priceRsd,
    bankName: settings.paymentBankName,
    accountHolder: settings.paymentAccountHolder,
    accountNumber: settings.paymentAccountNumber,
    instructions: settings.paymentInstructions,
    reference,
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendNewPendingOrderEmail({
      to: adminEmail,
      eventName: input.eventName,
      ownerEmail,
      packageName: pkg.name,
      adminUrl: `${baseUrl}/admin/events/${event.id}`,
    });
  }

  return { eventId: event.id };
}

export async function activateEventAfterPayment(id: string, baseUrl: string) {
  const event = await eventRepository.findById(id);
  if (!event) throw new Error("Događaj nije pronađen");
  if (event.status !== "PENDING") throw new Error("Događaj nije na čekanju");

  const pkg = getPackage(event.packageId);

  const updated = await eventRepository.update(id, {
    status: "ACTIVE",
    uploadEnabled: true,
    viewEnabled: true,
    allowGuestsToViewPhotos: true,
    allowGuestsToDownloadPhotos: pkg.allowGuestDownload,
  });

  let emailSent = false;
  const owner = event.owner;
  if (owner && !owner.activated && owner.activationToken) {
    emailSent = await sendOwnerActivationEmail({
      to: owner.email,
      eventName: stripHtml(event.eventName),
      activationUrl: `${baseUrl}/activate/${owner.activationToken}`,
    });
  }

  return { event: updated, emailSent };
}

export async function updateEvent(
  id: string,
  input: Partial<EventFormInput> & {
    endDate?: Date;
    isExpired?: boolean;
    coverImageUrl?: string | null;
    status?: "PENDING" | "ACTIVE" | "EXPIRED";
  }
) {
  const data: Record<string, unknown> = {};

  if (input.eventName !== undefined) data.eventName = sanitizeRichText(input.eventName);
  if (input.eventDescription !== undefined)
    data.eventDescription = sanitizeRichText(input.eventDescription);
  if (input.ownerEmail !== undefined) data.ownerEmail = input.ownerEmail.toLowerCase();
  if (input.storageLimitGB !== undefined) data.storageLimitGB = input.storageLimitGB;
  if (input.activeDays !== undefined) data.activeDays = input.activeDays;
  if (input.uploadEnabled !== undefined) data.uploadEnabled = input.uploadEnabled;
  if (input.viewEnabled !== undefined) data.viewEnabled = input.viewEnabled;
  if (input.allowGuestsToViewPhotos !== undefined)
    data.allowGuestsToViewPhotos = input.allowGuestsToViewPhotos;
  if (input.allowGuestsToDownloadPhotos !== undefined)
    data.allowGuestsToDownloadPhotos = input.allowGuestsToDownloadPhotos;
  if (input.endDate !== undefined) data.endDate = input.endDate;
  if (input.status !== undefined) data.status = input.status;
  if (input.isExpired !== undefined) {
    data.isExpired = input.isExpired;
    if (input.isExpired) data.uploadEnabled = false;
  }
  if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl;

  return eventRepository.update(id, data);
}

export async function extendEventDuration(id: string, additionalDays: number) {
  const event = await eventRepository.findById(id);
  if (!event) throw new Error("Događaj nije pronađen");

  const base = event.endDate > new Date() ? event.endDate : new Date();
  const endDate = addDays(base, additionalDays);

  return eventRepository.update(id, {
    endDate,
    isExpired: false,
    uploadEnabled: true,
    expirationWarningSent: false,
  });
}

export async function expireEvent(id: string) {
  return eventRepository.update(id, {
    isExpired: true,
    uploadEnabled: false,
    status: "EXPIRED",
  });
}

export async function resetOwnerPassword(ownerId: string, baseUrl: string) {
  const owner = await userRepository.findById(ownerId);
  if (!owner) throw new Error("Vlasnik nije pronađen");

  const token = activationToken();
  const activationExpiry = addDays(new Date(), 7);

  await userRepository.update(ownerId, {
    passwordHash: null,
    activated: false,
    activationToken: token,
    activationExpiry,
  });

  const activationUrl = `${baseUrl}/activate/${token}`;
  const emailSent = await sendOwnerActivationEmail({
    to: owner.email,
    eventName: "Vaš nalog",
    activationUrl,
  });

  return { activationUrl, emailSent };
}

export async function deleteEvent(id: string) {
  const event = await eventRepository.findById(id);
  if (!event) throw new Error("Događaj nije pronađen");

  const ownerId = event.ownerId;

  await deleteFolderFromR2(event.folderName);
  await eventRepository.delete(id);

  if (ownerId) {
    const remainingEvents = await eventRepository.countByOwner(ownerId);
    if (remainingEvents === 0) {
      const owner = await userRepository.findById(ownerId);
      if (owner?.role === Role.OWNER) {
        await userRepository.delete(ownerId);
      }
    }
  }

  return { deletedOwner: Boolean(ownerId) };
}

export async function getEventStats(eventId: string) {
  const event = await eventRepository.findById(eventId);
  if (!event) return null;

  const usedBytes = await eventRepository.getStorageUsedBytes(eventId);
  const limitBytes = event.storageLimitGB * 1024 * 1024 * 1024;
  const photoCount = event._count.photos;

  const now = new Date();
  const remainingMs = Math.max(0, event.endDate.getTime() - now.getTime());
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  return {
    usedBytes,
    limitBytes,
    usedPercent: Math.min(100, (usedBytes / limitBytes) * 100),
    photoCount,
    remainingDays,
    isExpired: event.isExpired || event.endDate < now,
  };
}
