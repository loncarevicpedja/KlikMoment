"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Building2, Cake, Cross, Heart, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { sr } from "@/content/sr";
import { packages } from "@/content/packages";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { WizardStep1 } from "@/lib/validations/wizard";

const categories = [
  { id: "WEDDING" as const, label: "Venčanje", icon: Heart },
  { id: "BIRTHDAY" as const, label: "Rođendan", icon: Cake },
  { id: "CORPORATE" as const, label: "Korporativni", icon: Building2 },
  { id: "CHRISTENING" as const, label: "Krštenje", icon: Cross },
];

const inputClass =
  "mt-1.5 rounded-xl border-[#D1E7D9] bg-white focus-visible:ring-[#16A34A]";

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prePackage = searchParams.get("paket") ?? "premium";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cover, setCover] = useState<File | null>(null);

  const [step1, setStep1] = useState<WizardStep1>({
    eventName: "",
    category: "WEDDING",
    eventDate: "",
    location: "",
    eventDescription: "",
  });

  const [step2, setStep2] = useState({
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    packageId: prePackage as "basic" | "premium" | "pro",
  });

  const submit = async () => {
    setLoading(true);
    const fd = new FormData();
    fd.append("step1", JSON.stringify(step1));
    fd.append("step2", JSON.stringify(step2));
    if (cover) fd.append("cover", cover);

    const res = await fetch("/api/orders/create", { method: "POST", body: fd });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? sr.common.error);
      return;
    }

    router.push("/kreiraj/uspeh");
  };

  const progress = step === 1 ? 50 : 100;

  return (
    <div className="min-h-screen bg-[#F4FAF6]">
      <header className="sticky top-0 z-50 border-b border-[#D1E7D9] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-4">
          <BrandLogo size="sm" />
          <Link href="/" className="text-sm text-[#5C6B63] hover:text-[#14532D]">
            {sr.common.cancel}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-medium text-[#5C6B63]">
            <span className={step >= 1 ? "text-[#16A34A]" : ""}>{sr.wizard.stepCreate}</span>
            <span className={step >= 2 ? "text-[#16A34A]" : ""}>{sr.wizard.stepPackage}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#D1E7D9]">
            <div
              className="h-full rounded-full bg-[#16A34A] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[#D1E7D9] bg-white p-6 shadow-sm sm:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-[#0F1F17]">{sr.wizard.createTitle}</h1>
                <p className="mt-1 text-sm text-[#5C6B63]">{sr.wizard.createSubtitle}</p>
              </div>

              <div>
                <Label htmlFor="eventName">{sr.wizard.eventName}</Label>
                <Input
                  id="eventName"
                  className={inputClass}
                  placeholder={sr.wizard.placeholders.eventName}
                  value={step1.eventName}
                  onChange={(e) => setStep1({ ...step1, eventName: e.target.value })}
                />
              </div>

              <div>
                <Label>{sr.wizard.category}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setStep1({ ...step1, category: c.id })}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition",
                        step1.category === c.id
                          ? "border-[#16A34A] bg-[#DCFCE7] text-[#14532D]"
                          : "border-[#D1E7D9] bg-[#F4FAF6] text-[#5C6B63] hover:border-[#86EFAC]"
                      )}
                    >
                      <c.icon className="h-3.5 w-3.5" />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="eventDate">{sr.wizard.eventDate}</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    className={inputClass}
                    value={step1.eventDate}
                    onChange={(e) => setStep1({ ...step1, eventDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="location">{sr.wizard.location}</Label>
                  <Input
                    id="location"
                    className={inputClass}
                    placeholder={sr.wizard.placeholders.location}
                    value={step1.location}
                    onChange={(e) => setStep1({ ...step1, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="welcome">{sr.wizard.welcomeMessage}</Label>
                <textarea
                  id="welcome"
                  className={cn(
                    inputClass,
                    "min-h-[88px] w-full resize-y px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#16A34A]/30"
                  )}
                  placeholder={sr.wizard.placeholders.welcomeMessage}
                  value={step1.eventDescription}
                  onChange={(e) => setStep1({ ...step1, eventDescription: e.target.value })}
                />
              </div>

              <div>
                <Label>{sr.wizard.coverImage}</Label>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashed border-[#D1E7D9] bg-[#F4FAF6] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#16A34A] shadow-sm">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="cursor-pointer">
                      <span className="text-sm font-medium text-[#16A34A] hover:underline">
                        {cover ? cover.name : sr.wizard.uploadClick}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setCover(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <p className="text-xs text-[#5C6B63]">{sr.wizard.coverHint}</p>
                  </div>
                  {cover && (
                    <button
                      type="button"
                      onClick={() => setCover(null)}
                      className="rounded-lg p-1 text-[#5C6B63] hover:bg-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-[#16A34A] hover:bg-[#15803D]"
                onClick={() => {
                  if (!step1.eventName || !step1.eventDate) {
                    toast.error(sr.wizard.fillRequired);
                    return;
                  }
                  setStep(2);
                }}
              >
                {sr.common.next}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-[#0F1F17]">{sr.wizard.packageTitle}</h1>
                <p className="mt-1 text-sm text-[#5C6B63]">{sr.wizard.packageSubtitle}</p>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">{sr.wizard.contactSection}</legend>
                <Input
                  className={inputClass}
                  placeholder={sr.wizard.placeholders.ownerName}
                  value={step2.ownerName}
                  onChange={(e) => setStep2({ ...step2, ownerName: e.target.value })}
                />
                <Input
                  type="email"
                  className={inputClass}
                  placeholder={sr.wizard.placeholders.ownerEmail}
                  value={step2.ownerEmail}
                  onChange={(e) => setStep2({ ...step2, ownerEmail: e.target.value })}
                />
                <Input
                  type="tel"
                  className={inputClass}
                  placeholder={sr.wizard.placeholders.ownerPhone}
                  value={step2.ownerPhone}
                  onChange={(e) => setStep2({ ...step2, ownerPhone: e.target.value })}
                />
              </fieldset>

              <div>
                <Label>{sr.wizard.selectPackage}</Label>
                <div className="mt-2 space-y-2">
                  {packages.map((pkg) => {
                    const selected = step2.packageId === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setStep2({ ...step2, packageId: pkg.id })}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition",
                          selected
                            ? "border-[#16A34A] bg-[#F0FDF4] ring-1 ring-[#16A34A]/30"
                            : "border-[#D1E7D9] hover:border-[#86EFAC]"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                            selected
                              ? "border-[#16A34A] bg-[#16A34A] text-white"
                              : "border-[#D1E7D9]"
                          )}
                        >
                          {selected && <span className="text-[10px]">✓</span>}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold">{pkg.name}</span>
                            <span className="text-sm font-bold text-[#14532D]">
                              {pkg.priceRsd.toLocaleString("sr-RS")} RSD
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[#5C6B63]">{pkg.tagline}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-[#D1E7D9]"
                  onClick={() => setStep(1)}
                >
                  {sr.common.back}
                </Button>
                <Button
                  className="flex-[2] bg-[#16A34A] hover:bg-[#15803D]"
                  disabled={loading}
                  onClick={() => void submit()}
                >
                  {loading ? sr.common.loading : sr.wizard.submitRequest}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function KreirajPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#5C6B63]">{sr.common.loading}</div>}>
      <WizardContent />
    </Suspense>
  );
}
