"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Download, ExternalLink, QrCode, Trash2 } from "lucide-react";
import { QrViewer } from "@/components/admin/qr-viewer";
import { EventForm } from "@/components/admin/event-form";
import { PhotoGallery } from "@/components/gallery/photo-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { sr } from "@/content/sr";
import { copyToClipboard } from "@/lib/utils";

export default function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [showQr, setShowQr] = useState(false);
  const [event, setEvent] = useState<{
    slug: string;
    ownerId: string | null;
    coverImageUrl: string | null;
    eventName: string;
    eventDescription: string;
    ownerEmail: string;
    storageLimitGB: number;
    activeDays: number;
    uploadEnabled: boolean;
    viewEnabled: boolean;
    allowGuestsToViewPhotos: boolean;
    allowGuestsToDownloadPhotos: boolean;
    status: string;
  } | null>(null);

  const load = () => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then(setEvent);
  };

  useEffect(() => {
    load();
  }, [id]);

  const runAction = async (action: string, days?: number) => {
    const body = days ? { action, days } : { action };
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      toast.success(action === "activate" ? sr.admin.activated : sr.toast.saved);
      load();
    } else toast.error(sr.common.error);
  };

  const deleteEvent = async () => {
    if (!confirm(sr.admin.deleteConfirm)) {
      return;
    }

    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(sr.admin.eventDeleted);
      router.push("/admin/events");
    } else {
      toast.error(sr.admin.deleteFailed);
    }
  };

  if (!event) {
    return <Skeleton className="h-96 w-full" />;
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${baseUrl}/e/${event.slug}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{sr.admin.editEvent}</h1>
          <p className="mt-1 font-mono text-sm text-violet-600">{publicUrl}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowQr(true)}>
            <QrCode className="h-4 w-4" />
            {sr.admin.qrCode}
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/e/${event.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
              {sr.admin.publicPage}
            </Link>
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = `/api/photos/download-all?eventId=${id}`)}
          >
            <Download className="h-4 w-4" />
            {sr.admin.allZip}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{sr.admin.quickActions}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {sr.admin.eventSection}
            </p>
            <div className="flex flex-wrap gap-2">
              {event.status === "PENDING" && (
                <Button onClick={() => runAction("activate")}>
                  {sr.admin.activateAfterPayment}
                </Button>
              )}
              <Button variant="outline" onClick={() => runAction("extend", 7)}>
                {sr.admin.extend7Days}
              </Button>
              <Button variant="outline" onClick={() => runAction("expire")}>
                {sr.admin.expireNow}
              </Button>
            </div>
          </div>

          {event.ownerId && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {sr.admin.ownerSection}
              </p>
              <Button
                variant="outline"
                onClick={async () => {
                  const res = await fetch(
                    `/api/users/${event.ownerId}/reset-password`,
                    { method: "POST" }
                  );
                  const data = await res.json();
                  if (res.ok) {
                    if (data.emailSent) {
                      toast.success(sr.admin.activationEmailSent);
                    } else if (data.activationUrl) {
                      const copied = await copyToClipboard(data.activationUrl);
                      toast.success(
                        copied
                          ? sr.admin.emailNotConfiguredCopied
                          : sr.admin.emailNotConfiguredCopy,
                        {
                          description: data.activationUrl,
                          duration: 30_000,
                        }
                      );
                    } else {
                      toast.success(sr.admin.passwordReset);
                    }
                  } else toast.error(sr.admin.failed);
                }}
              >
                {sr.admin.resetOwnerPassword}
              </Button>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">
              {sr.admin.dangerZone}
            </p>
            <Button variant="destructive" onClick={deleteEvent}>
              <Trash2 className="h-4 w-4" />
              {sr.admin.deleteEvent}
            </Button>
          </div>
        </CardContent>
      </Card>

      <EventForm
        eventId={id}
        coverImageUrl={event.coverImageUrl}
        initial={{
          eventName: event.eventName,
          eventDescription: event.eventDescription,
          ownerEmail: event.ownerEmail,
          storageLimitGB: event.storageLimitGB,
          activeDays: event.activeDays,
          uploadEnabled: event.uploadEnabled,
          viewEnabled: event.viewEnabled,
          allowGuestsToViewPhotos: event.allowGuestsToViewPhotos,
          allowGuestsToDownloadPhotos: event.allowGuestsToDownloadPhotos,
        }}
      />

      <div>
        <h2 className="mb-4 text-xl font-semibold">{sr.admin.gallery}</h2>
        <PhotoGallery
          eventId={id}
          canDownload
          canDelete
          canLike
          showSelect
          showLikedFilter
        />
      </div>

      {showQr && (
        <QrViewer
          eventId={id}
          slug={event.slug}
          onClose={() => setShowQr(false)}
        />
      )}
    </div>
  );
}
