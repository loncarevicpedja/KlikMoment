import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { sr } from "@/content/sr";
import { Button } from "@/components/ui/button";

export default function KreirajUspehPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4FAF6] px-4 text-center">
      <div className="max-w-md rounded-2xl border border-[#D1E7D9] bg-white p-8 shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#0F1F17]">{sr.wizard.successTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5C6B63]">{sr.wizard.successBody}</p>
        <Button asChild className="mt-8 w-full bg-[#16A34A] hover:bg-[#15803D]">
          <Link href="/">{sr.nav.home}</Link>
        </Button>
      </div>
    </div>
  );
}
