import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/permissions";
import { siteSettingsRepository } from "@/lib/repositories/site-settings-repository";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await siteSettingsRepository.get();
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const settings = await siteSettingsRepository.update({
    paymentBankName: body.paymentBankName ?? null,
    paymentAccountHolder: body.paymentAccountHolder ?? null,
    paymentAccountNumber: body.paymentAccountNumber ?? null,
    paymentInstructions: body.paymentInstructions ?? null,
    paymentReferenceTpl: body.paymentReferenceTpl,
  });

  return NextResponse.json(settings);
}
