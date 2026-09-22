"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Cake,
  Check,
  ChevronDown,
  Cross,
  Heart,
  Menu,
  QrCode,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { sr } from "@/content/sr";
import { packages } from "@/content/packages";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const eventTypes = [
  { id: "wedding", label: "Venčanje", icon: Heart },
  { id: "birthday", label: "Rođendan", icon: Cake },
  { id: "corporate", label: "Korporativni", icon: Building2 },
  { id: "christening", label: "Krštenje", icon: Cross },
];

const highlights = [
  { icon: QrCode, title: "QR za sekund", desc: "Jedan kod — svi gosti odmah šalju slike." },
  { icon: Upload, title: "Slike i video", desc: "Bez aplikacije, direktno iz pregledača." },
  { icon: Zap, title: "Uživo u galeriji", desc: "Vidite sve dok se proslava dešava." },
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#F4FAF6] text-[#0F1F17]">
      <header className="sticky top-0 z-50 border-b border-[#D1E7D9] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <BrandLogo size="sm" />
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#kako-radi" className="text-sm text-[#5C6B63] hover:text-[#14532D]">
              {sr.nav.howItWorks}
            </a>
            <a href="#paketi" className="text-sm text-[#5C6B63] hover:text-[#14532D]">
              {sr.nav.packages}
            </a>
            <a href="#faq" className="text-sm text-[#5C6B63] hover:text-[#14532D]">
              {sr.nav.faq}
            </a>
            <Link href="/login" className="text-sm text-[#5C6B63] hover:text-[#14532D]">
              {sr.nav.signIn}
            </Link>
            <Button asChild className="bg-[#16A34A] shadow-md shadow-green-600/20 hover:bg-[#15803D]">
              <Link href="/kreiraj">{sr.nav.createGallery}</Link>
            </Button>
          </nav>
          <button type="button" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-[#D1E7D9] px-4 py-3 md:hidden">
            <a href="#kako-radi" className="block py-2 text-sm" onClick={() => setMenuOpen(false)}>
              {sr.nav.howItWorks}
            </a>
            <a href="#paketi" className="block py-2 text-sm" onClick={() => setMenuOpen(false)}>
              {sr.nav.packages}
            </a>
            <Link href="/kreiraj" className="block py-2 text-sm font-medium text-[#16A34A]">
              {sr.nav.createGallery}
            </Link>
            <Link href="/login" className="block py-2 text-sm">
              {sr.nav.signIn}
            </Link>
          </nav>
        )}
      </header>

      {/* Hero — split layout, no wedding photo */}
      <section className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#86EFAC]/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#BBF7D0]/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BBF7D0] bg-white px-3 py-1 text-xs font-medium text-[#15803D]">
              <Sparkles className="h-3.5 w-3.5" />
              Digitalna galerija za proslave
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              {sr.landing.heroTitle}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-[#5C6B63]">
              {sr.landing.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#16A34A] hover:bg-[#15803D]">
                <Link href="/kreiraj">{sr.landing.heroCta}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#D1E7D9] bg-white text-[#14532D] hover:bg-[#F0FDF4]"
              >
                <a href="#kako-radi">{sr.landing.heroSecondary}</a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-[#5C6B63]">{sr.landing.trustLine}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <div className="rounded-3xl border border-[#D1E7D9] bg-white p-6 shadow-xl shadow-green-900/5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#14532D]">Galerija uživo</span>
                <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-medium text-[#15803D]">
                  47 novih
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["bg-emerald-100", "bg-green-200/70", "bg-lime-100", "bg-teal-100", "bg-emerald-200/60", "bg-green-100"].map(
                  (bg, i) => (
                    <div key={i} className={cn("aspect-square rounded-xl", bg)} />
                  )
                )}
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F0FDF4] p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#16A34A] text-white">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">Skeniraj i podeli</p>
                  <p className="text-xs text-[#5C6B63]">Bez registracije, odmah slanje</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Slogan band */}
      <section className="border-y border-[#D1E7D9] bg-[#14532D] py-10 text-center text-white">
        <p className="text-xl font-medium sm:text-2xl">{sr.landing.slogan}</p>
      </section>

      {/* Highlights */}
      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
          {highlights.map((item, i) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#D1E7D9] bg-white p-6 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#16A34A]">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-[#5C6B63]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="kako-radi" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold sm:text-4xl">{sr.landing.howTitle}</h2>
            <p className="mt-3 text-[#5C6B63]">{sr.landing.howSubtitle}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {sr.landing.steps.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl bg-[#F4FAF6] p-6 pt-8">
                <span className="absolute -top-3 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-[#16A34A] text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5C6B63]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="paketi" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">{sr.landing.packagesTitle}</h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-md",
                  pkg.highlighted
                    ? "border-[#16A34A] ring-2 ring-[#16A34A]/20"
                    : "border-[#D1E7D9]"
                )}
              >
                {pkg.highlighted && (
                  <span className="mb-3 w-fit rounded-full bg-[#DCFCE7] px-3 py-0.5 text-xs font-semibold text-[#15803D]">
                    Preporučeno
                  </span>
                )}
                <h3 className="text-xl font-bold">{pkg.name}</h3>
                <p className="mt-1 text-sm text-[#5C6B63]">{pkg.tagline}</p>
                <p className="mt-5 text-3xl font-bold text-[#14532D]">
                  {pkg.priceRsd.toLocaleString("sr-RS")}{" "}
                  <span className="text-base font-normal text-[#5C6B63]">RSD</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-[#16A34A]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={cn(
                    "mt-8 w-full",
                    pkg.highlighted
                      ? "bg-[#16A34A] hover:bg-[#15803D]"
                      : "bg-[#14532D] hover:bg-[#14532D]/90"
                  )}
                >
                  <Link href={`/kreiraj?paket=${pkg.id}`}>Izaberi {pkg.name}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event types — compact chips grid */}
      <section className="border-t border-[#D1E7D9] bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#16A34A]">
            {sr.landing.eventTypesSubtitle}
          </p>
          <h2 className="mt-2 text-3xl font-bold">{sr.landing.eventTypesTitle}</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {eventTypes.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-2xl border border-[#D1E7D9] bg-[#F4FAF6] px-6 py-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16A34A] text-white">
                  <t.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold">{sr.landing.faqTitle}</h2>
          <p className="mt-2 text-center text-[#5C6B63]">{sr.landing.faqSubtitle}</p>
          <div className="mt-10 space-y-3">
            {sr.faq.map((item, i) => (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-[#D1E7D9] bg-white"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-medium hover:bg-[#F4FAF6]"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {item.q}
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-[#16A34A] transition",
                      openFaq === i && "rotate-180"
                    )}
                  />
                </button>
                {openFaq === i && (
                  <p className="border-t border-[#D1E7D9] px-5 py-4 text-sm leading-relaxed text-[#5C6B63]">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D1E7D9] bg-white py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row">
          <BrandLogo size="sm" />
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#5C6B63]">
            <Link href="/kreiraj" className="hover:text-[#14532D]">
              {sr.nav.createGallery}
            </Link>
            <a href="#faq" className="hover:text-[#14532D]">
              {sr.nav.faq}
            </a>
            <Link href="/login" className="hover:text-[#14532D]">
              {sr.nav.signIn}
            </Link>
          </div>
          <p className="text-xs text-[#5C6B63]">
            © {new Date().getFullYear()} {sr.brand}
          </p>
        </div>
      </footer>
    </div>
  );
}
