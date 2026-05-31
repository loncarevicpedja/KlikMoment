import { AppShell } from "@/components/layout/app-shell";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell variant="owner">{children}</AppShell>;
}
