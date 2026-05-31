import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const eventRepository = {
  findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: { owner: true, _count: { select: { photos: true } } },
    });
  },

  findBySlug(slug: string) {
    return prisma.event.findUnique({
      where: { slug },
      include: { _count: { select: { photos: true } } },
    });
  },

  findAll(params?: { includeExpired?: boolean }) {
    return prisma.event.findMany({
      where: params?.includeExpired ? undefined : { isExpired: false },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, email: true, name: true, activated: true } },
        _count: { select: { photos: true } },
      },
    });
  },

  create(data: Prisma.EventCreateInput) {
    return prisma.event.create({ data });
  },

  update(id: string, data: Prisma.EventUpdateInput) {
    return prisma.event.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.event.delete({ where: { id } });
  },

  countByOwner(ownerId: string, excludeEventId?: string) {
    return prisma.event.count({
      where: {
        ownerId,
        ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
      },
    });
  },

  async getStorageUsedBytes(eventId: string): Promise<number> {
    const result = await prisma.photo.aggregate({
      where: { eventId },
      _sum: { sizeBytes: true },
    });
    return result._sum.sizeBytes ?? 0;
  },

  findExpiringSoon(withinDays: number) {
    const now = new Date();
    const target = new Date();
    target.setDate(target.getDate() + withinDays);

    return prisma.event.findMany({
      where: {
        isExpired: false,
        expirationWarningSent: false,
        endDate: { gte: now, lte: target },
      },
    });
  },

  findExpired() {
    return prisma.event.findMany({
      where: {
        isExpired: false,
        endDate: { lt: new Date() },
      },
    });
  },
};
