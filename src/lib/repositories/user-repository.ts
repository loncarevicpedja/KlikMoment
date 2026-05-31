import { prisma } from "@/lib/prisma";
import type { Prisma, Role } from "@prisma/client";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByActivationToken(token: string) {
    return prisma.user.findUnique({ where: { activationToken: token } });
  },

  findAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { ownedEvents: true } } },
    });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },

  findByRole(role: Role) {
    return prisma.user.findMany({ where: { role } });
  },

  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
