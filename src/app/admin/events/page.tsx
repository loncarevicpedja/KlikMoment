"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextDisplay } from "@/components/editor/rich-text-editor";
import { formatDate } from "@/lib/utils";

type EventRow = {
  id: string;
  slug: string;
  eventName: string;
  ownerEmail: string;
  isExpired: boolean;
  endDate: string;
  _count: { photos: number };
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-600">Create and manage all events</p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="h-4 w-4" />
            New event
          </Link>
        </Button>
      </div>

      <div className="mt-8 space-y-4">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}

        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link href={`/admin/events/${event.id}`}>
              <Card className="transition hover:shadow-lg">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div>
                    <RichTextDisplay html={event.eventName} className="text-lg" />
                    <p className="mt-1 text-sm text-slate-500">{event.ownerEmail}</p>
                    <p className="text-xs text-slate-400">
                      /e/{event.slug} · {event._count.photos} photos · ends{" "}
                      {formatDate(event.endDate)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      event.isExpired
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {event.isExpired ? "Expired" : "Active"}
                  </span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
