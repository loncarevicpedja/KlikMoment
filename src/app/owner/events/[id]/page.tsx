"use client";

import { useEffect, useState, use, useCallback } from "react";
import { motion } from "framer-motion";
import { HardDrive, Image, Clock } from "lucide-react";
import { PhotoGallery } from "@/components/gallery/photo-gallery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/utils";

export default function OwnerEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [stats, setStats] = useState<{
    usedBytes: number;
    limitBytes: number;
    usedPercent: number;
    photoCount: number;
    remainingDays: number;
    isExpired: boolean;
  } | null>(null);
  const [galleryKey, setGalleryKey] = useState(0);

  const loadStats = useCallback(() => {
    fetch(`/api/owner/stats?eventId=${id}`)
      .then((r) => r.json())
      .then(setStats);
  }, [id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (!stats) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Event Gallery</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Image, label: "Photos", value: stats.photoCount },
          {
            icon: HardDrive,
            label: "Storage",
            value: `${formatBytes(stats.usedBytes)} / ${formatBytes(stats.limitBytes)}`,
          },
          {
            icon: Clock,
            label: "Days left",
            value: stats.isExpired ? "Expired" : stats.remainingDays,
          },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <item.icon className="h-8 w-8 text-violet-600" />
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="text-xl font-bold">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storage usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={stats.usedPercent} />
          <p className="mt-2 text-sm text-slate-500">
            {stats.usedPercent.toFixed(1)}% used
          </p>
        </CardContent>
      </Card>

      <PhotoGallery
        key={galleryKey}
        eventId={id}
        canDownload
        canDelete
        canLike
        showSelect
        showLikedFilter
      />
    </div>
  );
}
