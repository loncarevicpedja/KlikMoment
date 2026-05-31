import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eventRepository } from "@/lib/repositories/event-repository";
import { photoRepository } from "@/lib/repositories/photo-repository";
import {
  deleteEvent,
  expireEvent,
  extendEventDuration,
  updateEvent,
} from "@/lib/services/event-service";
import { eventUpdateSchema } from "@/lib/validations/event";
import { canManageEvent, isAdmin } from "@/lib/auth/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  const event = await eventRepository.findById(id);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canManageEvent(session, event) && !isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.action === "extend" && body.days) {
      const event = await extendEventDuration(id, Number(body.days));
      return NextResponse.json(event);
    }

    if (body.action === "expire") {
      const event = await expireEvent(id);
      return NextResponse.json(event);
    }

    const parsed = eventUpdateSchema.safeParse({ ...body, id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id: _id, ...data } = parsed.data;
    const event = await updateEvent(id, data);
    return NextResponse.json(event);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await deleteEvent(id);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
