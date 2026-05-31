import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eventRepository } from "@/lib/repositories/event-repository";
import { getEventStats } from "@/lib/services/event-service";
import { canManageEvent } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  const session = await auth();
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!eventId || !session?.user) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const event = await eventRepository.findById(eventId);
  if (!event || !canManageEvent(session, event)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getEventStats(eventId);
  return NextResponse.json(stats);
}
