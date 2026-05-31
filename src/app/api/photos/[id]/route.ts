import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { photoRepository } from "@/lib/repositories/photo-repository";
import { deletePhoto } from "@/lib/services/photo-service";
import { canManageEvent } from "@/lib/auth/permissions";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
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

  await deletePhoto(id, eventId);
  return NextResponse.json({ success: true });
}
