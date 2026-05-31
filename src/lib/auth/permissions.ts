import type { Role } from "@prisma/client";
import type { Session } from "next-auth";

export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "ADMIN";
}

export function isOwner(session: Session | null): boolean {
  return session?.user?.role === "OWNER";
}

export function canManageEvent(
  session: Session | null,
  event: { ownerId: string | null }
): boolean {
  if (!session?.user) return false;
  if (session.user.role === "ADMIN") return true;
  if (session.user.role === "OWNER" && event.ownerId === session.user.id) {
    return true;
  }
  return false;
}

export function requireRole(session: Session | null, roles: Role[]): void {
  if (!session?.user?.role || !roles.includes(session.user.role as Role)) {
    throw new Error("Unauthorized");
  }
}
