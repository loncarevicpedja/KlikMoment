"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sr } from "@/content/sr";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: sr.nav.dashboard, exact: true },
  { href: "/admin/events", label: sr.nav.events },
  { href: "/admin/users", label: sr.nav.users },
  { href: "/admin/settings", label: sr.nav.settings },
];

const ownerLinks = [{ href: "/owner", label: sr.nav.myEvents }];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "admin" | "owner";
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const links = variant === "admin" ? adminLinks : ownerLinks;

  return (
    <div className="min-h-screen bg-[#F4FAF6] text-[#0F1F17]">
      <header className="sticky top-0 z-50 border-b border-[#D1E7D9] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <BrandLogo size="sm" />

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive(pathname, link.href, "exact" in link ? link.exact : false)
                    ? "bg-[#F0FDF4] text-[#14532D]"
                    : "text-[#5C6B63] hover:bg-[#F0FDF4] hover:text-[#14532D]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden max-w-[180px] truncate text-sm text-[#5C6B63] sm:inline">
              {session?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#5C6B63] hover:bg-[#F0FDF4] hover:text-[#14532D]"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{sr.nav.signOut}</span>
            </Button>
            <button
              type="button"
              className="rounded-lg p-2 text-[#5C6B63] hover:bg-[#F0FDF4] md:hidden"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Zatvori meni" : "Otvori meni"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-[#D1E7D9] md:hidden"
            >
              <div className="px-4 py-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive(pathname, link.href, "exact" in link ? link.exact : false)
                        ? "bg-[#F0FDF4] text-[#14532D]"
                        : "text-[#5C6B63]"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <p className="mt-2 truncate border-t border-[#D1E7D9] px-3 pt-3 text-xs text-[#5C6B63] sm:hidden">
                  {session?.user?.email}
                </p>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
