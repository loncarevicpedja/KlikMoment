import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resetOwnerPassword } from "@/lib/services/event-service";
import { isAdmin } from "@/lib/auth/permissions";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const baseUrl = process.env.AUTH_URL ?? req.nextUrl.origin;

  try {
    const { activationUrl, emailSent } = await resetOwnerPassword(id, baseUrl);
    return NextResponse.json({ success: true, activationUrl, emailSent });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Reset failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
