import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/user-repository";
import { isAdmin } from "@/lib/auth/permissions";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await userRepository.findAll();
  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      activated: u.activated,
      createdAt: u.createdAt,
      eventCount: u._count.ownedEvents,
    }))
  );
}
