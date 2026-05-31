import { addDays } from "date-fns";
import { customAlphabet } from "nanoid";
import { eventRepository } from "@/lib/repositories/event-repository";
import { userRepository } from "@/lib/repositories/user-repository";
import { sanitizeRichText } from "@/lib/sanitize";
import { generateFolderName, generateSecureSlug } from "@/lib/slug";
import { hashPassword } from "@/lib/password";
import { sendOwnerActivationEmail } from "@/lib/email";
import { deleteFolderFromR2 } from "@/lib/r2";
import type { EventFormInput } from "@/lib/validations/event";
import { Role } from "@prisma/client";

const activationToken = () => customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 32)();

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
  });

  let activationUrl: string | undefined;
  let emailSent: boolean | undefined;

  if (!owner.activated && owner.activationToken) {
    activationUrl = `${baseUrl}/activate/${owner.activationToken}`;
    emailSent = await sendOwnerActivationEmail({
      to: ownerEmail,
      eventName: input.eventName,
      activationUrl,
    });
  }

  return { event, activationUrl, emailSent };
}

export async function updateEvent(
  id: string,
  input: Partial<EventFormInput> & {
    endDate?: Date;
    isExpired?: boolean;
    coverImageUrl?: string | null;
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
  if (input.isExpired !== undefined) {
    data.isExpired = input.isExpired;
    if (input.isExpired) data.uploadEnabled = false;
  }
  if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl;

  return eventRepository.update(id, data);
}

export async function extendEventDuration(id: string, additionalDays: number) {
  const event = await eventRepository.findById(id);
  if (!event) throw new Error("Event not found");

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
  });
}

export async function resetOwnerPassword(ownerId: string, baseUrl: string) {
  const owner = await userRepository.findById(ownerId);
  if (!owner) throw new Error("Owner not found");

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
    eventName: "Your account",
    activationUrl,
  });

  return { activationUrl, emailSent };
}

export async function deleteEvent(id: string) {
  const event = await eventRepository.findById(id);
  if (!event) throw new Error("Event not found");

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
