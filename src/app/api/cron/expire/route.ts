import { NextRequest, NextResponse } from "next/server";
import { processExpirationJobs } from "@/lib/services/cron-service";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processExpirationJobs();
  return NextResponse.json(result);
}
