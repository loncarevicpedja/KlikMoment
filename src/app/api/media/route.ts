import { NextRequest, NextResponse } from "next/server";
import { getObjectStream } from "@/lib/r2";
import { Readable } from "stream";

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const body = await getObjectStream(key);
    if (!body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ext = key.split(".").pop()?.toLowerCase() ?? "jpeg";
    const contentType = EXT_MIME[ext] ?? "application/octet-stream";

    const webStream = Readable.toWeb(body as Readable) as ReadableStream;

    return new NextResponse(webStream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}
