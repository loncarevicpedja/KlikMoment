"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { sr } from "@/content/sr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    paymentBankName: "",
    paymentAccountHolder: "",
    paymentAccountNumber: "",
    paymentInstructions: "",
    paymentReferenceTpl: "KlikMoment-{eventId}",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          paymentBankName: data.paymentBankName ?? "",
          paymentAccountHolder: data.paymentAccountHolder ?? "",
          paymentAccountNumber: data.paymentAccountNumber ?? "",
          paymentInstructions: data.paymentInstructions ?? "",
          paymentReferenceTpl: data.paymentReferenceTpl ?? "KlikMoment-{eventId}",
        });
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) toast.success(sr.admin.settingsSaved);
    else toast.error(sr.common.error);
  };

  if (loading) return <p>{sr.common.loading}</p>;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">{sr.admin.paymentSettings}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{sr.admin.paymentSettings}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{sr.admin.bankName}</Label>
            <Input
              className="mt-1"
              value={form.paymentBankName}
              onChange={(e) => setForm({ ...form, paymentBankName: e.target.value })}
            />
          </div>
          <div>
            <Label>{sr.admin.accountHolder}</Label>
            <Input
              className="mt-1"
              value={form.paymentAccountHolder}
              onChange={(e) => setForm({ ...form, paymentAccountHolder: e.target.value })}
            />
          </div>
          <div>
            <Label>{sr.admin.accountNumber}</Label>
            <Input
              className="mt-1"
              value={form.paymentAccountNumber}
              onChange={(e) => setForm({ ...form, paymentAccountNumber: e.target.value })}
            />
          </div>
          <div>
            <Label>{sr.admin.paymentInstructions}</Label>
            <textarea
              className="mt-1 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm"
              value={form.paymentInstructions}
              onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
            />
          </div>
          <div>
            <Label>{sr.admin.referenceTemplate}</Label>
            <Input
              className="mt-1"
              value={form.paymentReferenceTpl}
              onChange={(e) => setForm({ ...form, paymentReferenceTpl: e.target.value })}
            />
          </div>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? sr.admin.saving : sr.common.save}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
