import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { photoRepository } from "@/lib/repositories/photo-repository";
import { canManageEvent } from "@/lib/auth/permissions";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const photo = await photoRepository.findById(id);
  if (!photo || photo.eventId !== eventId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canManageEvent(session, photo.event)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const liked = Boolean(body.liked);

    const updated = await photoRepository.setLikedByOwner(id, eventId, liked);
    return NextResponse.json({
      id: updated.id,
      likedByOwner: updated.likedByOwner,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
  }
}
