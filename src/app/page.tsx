"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, QrCode, Shield, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: QrCode,
    title: "QR Guest Access",
    desc: "Guests scan and upload instantly—no app install.",
  },
  {
    icon: Upload,
    title: "Cloud Storage",
    desc: "Secure Cloudflare R2 storage with limits per event.",
  },
  {
    icon: Shield,
    title: "Permission Control",
    desc: "Fine-tune gallery visibility and downloads.",
  },
  {
    icon: Sparkles,
    title: "Premium Gallery",
    desc: "Masonry layout, animations, and polished UX.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-violet-50/80 via-white to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2 text-xl font-bold text-violet-700">
          <Camera className="h-7 w-7" />
          KlikMoment
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-12 text-center sm:px-6 sm:pt-20">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block rounded-full bg-violet-100 px-4 py-1 text-sm font-medium text-violet-700">
            Wedding & Event Photo SaaS
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Capture every moment.
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              Share instantly.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            QR-powered guest uploads, beautiful galleries, and enterprise-grade
            cloud storage—built for weddings and celebrations.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/login">Admin / Owner Login</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mx-auto mt-16 max-w-4xl rounded-3xl border border-slate-200/80 bg-white p-2 shadow-2xl shadow-violet-200/40"
        >
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 p-8 text-left text-white sm:p-12">
            <p className="text-sm font-medium opacity-90">Public event URL</p>
            <p className="mt-2 font-mono text-lg sm:text-2xl">klikmoment.com/e/x7k9m2p4q8w1</p>
            <p className="mt-4 text-sm opacity-80">
              Secure non-guessable slugs • Rich text titles • Drag & drop uploads
            </p>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/40"
          >
            <f.icon className="mb-4 h-8 w-8 text-violet-600" />
            <h3 className="font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
