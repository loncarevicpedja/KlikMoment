import { NextRequest, NextResponse } from "next/server";
import { wizardStep1Schema, wizardStep2Schema } from "@/lib/validations/wizard";
import { createPendingOrder } from "@/lib/services/event-service";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const limit = rateLimit(`order:${ip}`, 5, 60_000);

  if (!limit.success) {
    return NextResponse.json({ error: "Previše zahteva" }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const step1 = wizardStep1Schema.parse(JSON.parse(String(formData.get("step1"))));
    const step2 = wizardStep2Schema.parse(JSON.parse(String(formData.get("step2"))));
    const coverFile = formData.get("cover") as File | null;

    let coverBuffer: Buffer | undefined;
    if (coverFile && coverFile.size > 0) {
      coverBuffer = Buffer.from(await coverFile.arrayBuffer());
    }

    const baseUrl = process.env.AUTH_URL ?? req.nextUrl.origin;

    const result = await createPendingOrder(
      {
        eventName: step1.eventName,
        eventDescription: step1.eventDescription ?? "",
        category: step1.category,
        eventDate: new Date(step1.eventDate),
        location: step1.location,
        ownerName: step2.ownerName,
        ownerEmail: step2.ownerEmail,
        ownerPhone: step2.ownerPhone,
        packageId: step2.packageId,
        coverBuffer,
      },
      baseUrl
    );

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Greška pri slanju zahteva";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
