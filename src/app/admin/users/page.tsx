"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { sr } from "@/content/sr";
import { formatDate, copyToClipboard } from "@/lib/utils";

type UserRow = {
  id: string;
  email: string;
  role: string;
  activated: boolean;
  createdAt: string;
  eventCount: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  const resetPassword = async (id: string) => {
    const res = await fetch(`/api/users/${id}/reset-password`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      if (data.emailSent) {
        toast.success(sr.admin.activationEmailSent);
      } else if (data.activationUrl) {
        const copied = await copyToClipboard(data.activationUrl);
        toast.success(
          copied ? sr.admin.emailNotConfiguredCopied : sr.admin.emailNotConfiguredCopy,
          {
            description: data.activationUrl,
            duration: 30_000,
          }
        );
      } else {
        toast.success(sr.admin.passwordReset);
      }
    } else toast.error(sr.admin.failed);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">{sr.admin.usersTitle}</h1>
      <p className="mt-1 text-slate-600">{sr.admin.usersSubtitle}</p>

      <div className="mt-8 space-y-3">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}

        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-slate-500">
                  {user.role === "ADMIN" ? sr.admin.roleAdmin : sr.admin.roleOwner} ·{" "}
                  {user.eventCount} {sr.nav.events.toLowerCase()} ·{" "}
                  {sr.admin.joined} {formatDate(user.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    user.activated
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {user.activated ? sr.admin.active : sr.admin.pending}
                </span>
                {user.role === "OWNER" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetPassword(user.id)}
                  >
                    {sr.admin.resetPassword}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
