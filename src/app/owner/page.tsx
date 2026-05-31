"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RichTextDisplay } from "@/components/editor/rich-text-editor";
import { formatDate } from "@/lib/utils";

type EventRow = {
  id: string;
  slug: string;
  eventName: string;
  isExpired: boolean;
  endDate: string;
  _count: { photos: number };
};

export default function OwnerDashboard() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/owner/events")
      .then((r) => r.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">My Events</h1>
      <p className="mt-1 text-slate-600">Manage your event galleries</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {loading &&
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}

        {events.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/owner/events/${event.id}`}>
              <Card className="h-full transition hover:shadow-lg">
                <CardContent className="p-6">
                  <RichTextDisplay html={event.eventName} />
                  <p className="mt-2 text-sm text-slate-500">
                    {event._count.photos} photos · ends {formatDate(event.endDate)}
                  </p>
                  <span
                    className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs ${
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

        {!loading && !events.length && (
          <p className="col-span-full text-center text-slate-500">
            No events assigned yet. Contact your administrator.
          </p>
        )}
      </div>
    </div>
  );
}
