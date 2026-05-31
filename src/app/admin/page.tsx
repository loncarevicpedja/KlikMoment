"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, HardDrive, Image, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    events: number;
    users: number;
    photos: number;
    storage: number;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/events").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([events, users]) => {
      const photos = events.reduce(
        (acc: number, e: { _count: { photos: number } }) => acc + e._count.photos,
        0
      );
      setStats({
        events: events.length,
        users: users.length,
        photos,
        storage: 0,
      });
    });
  }, []);

  const cards = [
    { label: "Events", value: stats?.events, icon: Calendar },
    { label: "Users", value: stats?.users, icon: Users },
    { label: "Photos", value: stats?.photos, icon: Image },
    { label: "Storage", value: stats ? formatBytes(stats.storage) : "—", icon: HardDrive },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
      <p className="mt-1 text-slate-600">Manage events, users, and platform usage.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {card.label}
                </CardTitle>
                <card.icon className="h-5 w-5 text-violet-600" />
              </CardHeader>
              <CardContent>
                {stats ? (
                  <p className="text-3xl font-bold">{card.value}</p>
                ) : (
                  <Skeleton className="h-9 w-16" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
