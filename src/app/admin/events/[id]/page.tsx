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
      toast.success("Updated");
      load();
    } else toast.error("Action failed");
  };

  const deleteEvent = async () => {
    if (
      !confirm(
        "Delete this event permanently?\n\nThis removes all photos, storage, and the owner account if they have no other events."
      )
    ) {
      return;
    }

    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Event deleted");
      router.push("/admin/events");
    } else {
      toast.error("Failed to delete event");
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
          <h1 className="text-3xl font-bold text-slate-900">Edit event</h1>
          <p className="mt-1 font-mono text-sm text-violet-600">{publicUrl}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowQr(true)}>
            <QrCode className="h-4 w-4" />
            QR Code
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/e/${event.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
              Public page
            </Link>
          </Button>
          <Button
            variant="secondary"
            onClick={() => (window.location.href = `/api/photos/download-all?eventId=${id}`)}
          >
            <Download className="h-4 w-4" />
            All ZIP
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Event
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => runAction("extend", 7)}>
                Extend 7 days
              </Button>
              <Button variant="outline" onClick={() => runAction("expire")}>
                Expire now
              </Button>
            </div>
          </div>

          {event.ownerId && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Owner
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
                      toast.success("Activation email sent");
                    } else if (data.activationUrl) {
                      const copied = await copyToClipboard(data.activationUrl);
                      toast.success(
                        copied
                          ? "Email not configured — activation link copied"
                          : "Email not configured — copy link from toast",
                        {
                          description: data.activationUrl,
                          duration: 30_000,
                        }
                      );
                    } else {
                      toast.success("Password reset");
                    }
                  } else toast.error("Failed");
                }}
              >
                Reset owner password
              </Button>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">
              Danger zone
            </p>
            <Button variant="destructive" onClick={deleteEvent}>
              <Trash2 className="h-4 w-4" />
              Delete event
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
        <h2 className="mb-4 text-xl font-semibold">Gallery</h2>
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
