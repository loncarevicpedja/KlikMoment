"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoverUpload } from "@/components/events/cover-upload";
import { sr } from "@/content/sr";
import { copyToClipboard, cn } from "@/lib/utils";

type EventFormData = {
  eventName: string;
  eventDescription: string;
  ownerEmail: string;
  storageLimitGB: number;
  activeDays: number;
  uploadEnabled: boolean;
  viewEnabled: boolean;
  allowGuestsToViewPhotos: boolean;
  allowGuestsToDownloadPhotos: boolean;
};

const defaults: EventFormData = {
  eventName: "<p></p>",
  eventDescription: "<p></p>",
  ownerEmail: "",
  storageLimitGB: 5,
  activeDays: 30,
  uploadEnabled: true,
  viewEnabled: true,
  allowGuestsToViewPhotos: false,
  allowGuestsToDownloadPhotos: false,
};

type EventFormProps = {
  initial?: Partial<EventFormData>;
  eventId?: string;
  coverImageUrl?: string | null;
};

export function EventForm({ initial, eventId, coverImageUrl }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormData>({ ...defaults, ...initial });
  const [loading, setLoading] = useState(false);
  const [cover, setCover] = useState<File | null>(null);

  const update = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "allowGuestsToViewPhotos" && !value) {
        next.allowGuestsToDownloadPhotos = false;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const url = eventId ? `/api/events/${eventId}` : "/api/events";
    const method = eventId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setLoading(false);
      toast.error(sr.admin.saveFailed);
      return;
    }

    const event = await res.json();

    if (cover) {
      const fd = new FormData();
      fd.append("file", cover);
      await fetch(`/api/events/${event.id}/cover`, { method: "POST", body: fd });
    }

    setLoading(false);

    if (!eventId && event.activationUrl && !event.emailSent) {
      const copied = await copyToClipboard(event.activationUrl);
      toast.warning(
        copied
          ? sr.admin.eventCreatedEmailFailed
          : sr.admin.eventCreatedEmailFailedNoCopy,
        {
          description: event.activationUrl,
          duration: 30_000,
        }
      );
    } else if (!eventId && event.emailSent) {
      toast.success(sr.admin.eventCreatedEmailSent);
    } else {
      toast.success(eventId ? sr.toast.eventUpdated : sr.toast.eventCreated);
    }

    router.push(`/admin/events/${event.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{sr.admin.eventDetails}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{sr.admin.eventName}</Label>
            <RichTextEditor
              value={form.eventName}
              onChange={(v) => update("eventName", v)}
              placeholder="Venčanje Ane i Marka"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>{sr.admin.description}</Label>
            <RichTextEditor
              value={form.eventDescription}
              onChange={(v) => update("eventDescription", v)}
              placeholder="Podelite svoje fotografije sa nama!"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="ownerEmail">{sr.admin.ownerEmail}</Label>
            <Input
              id="ownerEmail"
              type="email"
              value={form.ownerEmail}
              onChange={(e) => update("ownerEmail", e.target.value)}
              required
              disabled={!!eventId}
              className="mt-1.5"
            />
          </div>
          {eventId ? (
            <CoverUpload
              eventId={eventId}
              coverImageUrl={coverImageUrl}
              uploadOnSave
            />
          ) : (
            <div>
              <Label htmlFor="cover">{sr.owner.coverImage}</Label>
              <Input
                id="cover"
                type="file"
                accept="image/*"
                className="mt-1.5"
                onChange={(e) => setCover(e.target.files?.[0] ?? null)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{sr.admin.settings}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="storage">{sr.admin.storageLimit}</Label>
            <Input
              id="storage"
              type="number"
              step="0.5"
              value={form.storageLimitGB}
              onChange={(e) => update("storageLimitGB", Number(e.target.value))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="days">{sr.admin.activeDays}</Label>
            <Input
              id="days"
              type="number"
              value={form.activeDays}
              onChange={(e) => update("activeDays", Number(e.target.value))}
              className="mt-1.5"
              disabled={!!eventId}
            />
          </div>

          {(
            [
              ["uploadEnabled", sr.admin.uploadsEnabled, false],
              ["viewEnabled", sr.admin.viewEnabled, false],
              ["allowGuestsToViewPhotos", sr.admin.guestsCanView, false],
              ["allowGuestsToDownloadPhotos", sr.admin.guestsCanDownload, true],
            ] as const
          ).map(([key, label, requiresGallery]) => (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between rounded-xl border p-4",
                requiresGallery && !form.allowGuestsToViewPhotos && "opacity-50"
              )}
            >
              <Label>{label}</Label>
              <Switch
                checked={form[key as keyof EventFormData] as boolean}
                disabled={
                  requiresGallery ? !form.allowGuestsToViewPhotos : false
                }
                onCheckedChange={(v) =>
                  update(key as keyof EventFormData, v as EventFormData[keyof EventFormData])
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" size="lg" disabled={loading}>
        {loading
          ? sr.admin.saving
          : eventId
            ? sr.admin.updateEvent
            : sr.admin.createEvent}
      </Button>
    </form>
  );
}
