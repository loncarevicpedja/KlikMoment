import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eventRepository } from "@/lib/repositories/event-repository";
import { createEvent } from "@/lib/services/event-service";
import { eventFormSchema } from "@/lib/validations/event";
import { isAdmin } from "@/lib/auth/permissions";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await eventRepository.findAll({ includeExpired: true });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = eventFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const baseUrl = process.env.AUTH_URL ?? req.nextUrl.origin;
    const { event, activationUrl, emailSent } = await createEvent(parsed.data, baseUrl);
    return NextResponse.json(
      {
        ...event,
        activationUrl: activationUrl ?? null,
        emailSent: emailSent ?? null,
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
