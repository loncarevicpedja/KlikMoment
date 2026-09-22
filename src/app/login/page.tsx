"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LoginForm } from "./login-form";
import { Skeleton } from "@/components/ui/skeleton";
import { sr } from "@/content/sr";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4FAF6] p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <BrandLogo size="md" />
        </div>

        <Card className="border-[#D1E7D9] shadow-lg shadow-green-900/5">
          <CardHeader>
            <CardTitle>{sr.auth.signIn}</CardTitle>
          </CardHeader>
          <Suspense fallback={<Skeleton className="m-6 h-48" />}>
            <LoginForm />
          </Suspense>
        </Card>
      </motion.div>
    </div>
  );
}
