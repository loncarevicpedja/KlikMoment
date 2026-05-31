import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { eventRepository } from "@/lib/repositories/event-repository";
import { createPhotosZipStream } from "@/lib/services/zip-service";
import { canManageEvent } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "eventId required" }, { status: 400 });
  }

  const event = await eventRepository.findById(eventId);
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  const isManager = canManageEvent(session, event);

  if (!isManager && !event.allowGuestsToDownloadPhotos) {
    return NextResponse.json({ error: "Downloads disabled" }, { status: 403 });
  }

  const stream = await createPhotosZipStream(eventId);
  const webStream = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="all-photos-${event.slug}.zip"`,
    },
  });
}
