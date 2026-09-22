import { getPackage, type PackageId } from "@/content/packages";

export type { PackageId };

export function packageAllowsVideo(packageId: string): boolean {
  return getPackage(packageId).allowVideo;
}

export function applyPackageToEvent(packageId: PackageId) {
  const pkg = getPackage(packageId);
  return {
    packageId: pkg.id,
    activeDays: pkg.activeDays,
    storageLimitGB: pkg.storageLimitGB,
    allowGuestsToViewPhotos: true,
    allowGuestsToDownloadPhotos: pkg.allowGuestDownload,
  };
}
