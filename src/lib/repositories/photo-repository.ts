import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const photoRepository = {
  findById(id: string) {
    return prisma.photo.findUnique({ where: { id }, include: { event: true } });
  },

  findByEvent(
    eventId: string,
    options?: { likedOnly?: boolean; hideLikedFromGuests?: boolean }
  ) {
    return prisma.photo.findMany({
      where: {
        eventId,
        ...(options?.likedOnly ? { likedByOwner: true } : {}),
        ...(options?.hideLikedFromGuests ? { likedByOwner: false } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  findByIds(ids: string[], eventId: string) {
    return prisma.photo.findMany({
      where: { id: { in: ids }, eventId },
    });
  },

  create(data: Prisma.PhotoCreateInput) {
    return prisma.photo.create({ data });
  },

  delete(id: string) {
    return prisma.photo.delete({ where: { id } });
  },

  deleteMany(ids: string[], eventId: string) {
    return prisma.photo.deleteMany({
      where: { id: { in: ids }, eventId },
    });
  },

  setLikedByOwner(id: string, eventId: string, liked: boolean) {
    return prisma.photo.update({
      where: { id, eventId },
      data: { likedByOwner: liked },
    });
  },

  countByEvent(eventId: string, options?: { hideLikedFromGuests?: boolean }) {
    return prisma.photo.count({
      where: {
        eventId,
        ...(options?.hideLikedFromGuests ? { likedByOwner: false } : {}),
      },
    });
  },
};
