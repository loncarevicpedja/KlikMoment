const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function photoFilename(
  id: string,
  mimeType?: string,
  authorName?: string | null
): string {
  const ext = (mimeType && MIME_EXT[mimeType]) || "jpg";
  const prefix = authorName?.trim().replace(/[^\w.-]+/g, "_") || "photo";
  return `${prefix}-${id.slice(0, 8)}.${ext}`;
}

export async function downloadPhotoFile(params: {
  photoId: string;
  eventId: string;
  filename: string;
}): Promise<boolean> {
  const res = await fetch(
    `/api/photos/download?photoId=${params.photoId}&eventId=${params.eventId}`
  );
  if (!res.ok) return false;

  const blob = await res.blob();
  const file = new File([blob], params.filename, {
    type: blob.type || "image/jpeg",
  });

  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return true;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = params.filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export async function downloadBlobFile(
  blob: Blob,
  filename: string
): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
