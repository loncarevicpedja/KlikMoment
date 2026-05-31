import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/repositories/user-repository";
import { activateSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = activateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await userRepository.findByActivationToken(parsed.data.token);
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    if (user.activationExpiry && user.activationExpiry < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await userRepository.update(user.id, {
      passwordHash,
      activated: true,
      activationToken: null,
      activationExpiry: null,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Activation failed" }, { status: 500 });
  }
}
