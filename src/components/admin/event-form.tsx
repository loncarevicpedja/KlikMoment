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
import { mediaUrlFromPublicUrl } from "@/lib/media-url";
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
      toast.error("Failed to save event");
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
          ? "Event created — email could not be sent, activation link copied"
          : "Event created — email could not be sent",
        {
          description: event.activationUrl,
          duration: 30_000,
        }
      );
    } else if (!eventId && event.emailSent) {
      toast.success("Event created — activation email sent");
    } else {
      toast.success(eventId ? "Event updated" : "Event created");
    }

    router.push(`/admin/events/${event.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Event name</Label>
            <RichTextEditor
              value={form.eventName}
              onChange={(v) => update("eventName", v)}
              placeholder="Wedding of Ana & Marko"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Description</Label>
            <RichTextEditor
              value={form.eventDescription}
              onChange={(v) => update("eventDescription", v)}
              placeholder="Share your photos with us!"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="ownerEmail">Owner email</Label>
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
          <div>
            <Label htmlFor="cover">Cover image</Label>
            {coverImageUrl && !cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrlFromPublicUrl(coverImageUrl)}
                alt="Cover"
                className="mt-2 max-h-48 rounded-xl object-cover"
              />
            )}
            <Input
              id="cover"
              type="file"
              accept="image/*"
              className="mt-1.5"
              onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="storage">Storage limit (GB)</Label>
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
            <Label htmlFor="days">Active days</Label>
            <Input
              id="days"
              type="number"
              value={form.activeDays}
              onChange={(e) => update("activeDays", Number(e.target.value))}
              className="mt-1.5"
              disabled={!!eventId}
            />
          </div>

          {[
            ["uploadEnabled", "Uploads enabled", false],
            ["viewEnabled", "View enabled", false],
            ["allowGuestsToViewPhotos", "Guests can view gallery", false],
            ["allowGuestsToDownloadPhotos", "Guests can download", true],
          ].map(([key, label, requiresGallery]) => (
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
        {loading ? "Saving..." : eventId ? "Update event" : "Create event"}
      </Button>
    </form>
  );
}
