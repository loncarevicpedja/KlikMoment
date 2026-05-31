"use client";

import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-violet-700">
          <Camera className="h-8 w-8" />
          <span className="text-xl font-bold">KlikMoment</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <Suspense fallback={<Skeleton className="m-6 h-48" />}>
            <LoginForm />
          </Suspense>
        </Card>
      </motion.div>
    </div>
  );
}
