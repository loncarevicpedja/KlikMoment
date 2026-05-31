/** Serve R2 objects through our API (avoids 401 on public r2.dev + works with private buckets). */
export function mediaUrl(storageKey: string): string {
  return `/api/media?key=${encodeURIComponent(storageKey)}`;
}

export function coverStorageKey(folderName: string): string {
  return `${folderName}/cover.webp`;
}

/** Use for legacy rows that only have the full R2 public URL stored in DB. */
export function mediaUrlFromPublicUrl(publicUrl: string): string {
  try {
    const key = new URL(publicUrl).pathname.replace(/^\//, "");
    if (key) return mediaUrl(key);
  } catch {
    // ignore
  }
  return publicUrl;
}
