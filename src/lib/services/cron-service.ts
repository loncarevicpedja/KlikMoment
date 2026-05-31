import { eventRepository } from "@/lib/repositories/event-repository";
import { userRepository } from "@/lib/repositories/user-repository";
import {
  sendExpirationNoticeEmail,
  sendExpirationWarningEmail,
} from "@/lib/email";
import { Role } from "@prisma/client";

export async function processExpirationJobs() {
  const warnings = await eventRepository.findExpiringSoon(7);
  const admins = await userRepository.findByRole(Role.ADMIN);

  for (const event of warnings) {
    const daysLeft = Math.ceil(
      (event.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    await sendExpirationWarningEmail({
      to: event.ownerEmail,
      eventName: event.eventName,
      daysLeft,
    });

    for (const admin of admins) {
      await sendExpirationWarningEmail({
        to: admin.email,
        eventName: event.eventName,
        daysLeft,
        isAdmin: true,
      });
    }

    await eventRepository.update(event.id, { expirationWarningSent: true });
  }

  const expired = await eventRepository.findExpired();

  for (const event of expired) {
    await eventRepository.update(event.id, {
      isExpired: true,
      uploadEnabled: false,
    });

    await sendExpirationNoticeEmail({
      to: event.ownerEmail,
      eventName: event.eventName,
    });

    for (const admin of admins) {
      await sendExpirationNoticeEmail({
        to: admin.email,
        eventName: event.eventName,
        isAdmin: true,
      });
    }
  }

  return {
    warningsSent: warnings.length,
    expiredProcessed: expired.length,
  };
}
