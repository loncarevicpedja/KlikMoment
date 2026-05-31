import JSZip from "jszip";
import { Readable } from "stream";
import { photoRepository } from "@/lib/repositories/photo-repository";
import { getObjectStream } from "@/lib/r2";

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function createPhotosZipStream(
  eventId: string,
  photoIds?: string[]
): Promise<Readable> {
  const photos = photoIds?.length
    ? await photoRepository.findByIds(photoIds, eventId)
    : await photoRepository.findByEvent(eventId);

  const zip = new JSZip();

  for (const photo of photos) {
    try {
      const body = await getObjectStream(photo.storageKey);
      if (!body) continue;

      const buffer = await streamToBuffer(body as Readable);
      const ext = photo.storageKey.split(".").pop() ?? "jpg";
      const name = photo.authorName
        ? `${photo.authorName.replace(/[^a-z0-9-_]/gi, "_")}_${photo.id.slice(0, 8)}.${ext}`
        : `${photo.id}.${ext}`;

      zip.file(name, buffer);
    } catch {
      // skip failed files
    }
  }

  return zip.generateNodeStream({
    streamFiles: true,
    compression: "DEFLATE",
    compressionOptions: { level: 5 },
  }) as unknown as Readable;
}
