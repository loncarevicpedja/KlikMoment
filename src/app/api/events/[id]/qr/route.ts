import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { eventRepository } from "@/lib/repositories/event-repository";
import { canManageEvent, isAdmin } from "@/lib/auth/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  const event = await eventRepository.findById(id);

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canManageEvent(session, event) && !isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.AUTH_URL ?? req.nextUrl.origin;
  const url = `${baseUrl}/e/${event.slug}`;

  const png = await QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="qr-${event.slug}.png"`,
    },
  });
}
