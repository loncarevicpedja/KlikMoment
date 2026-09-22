import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { sr } from "@/content/sr";

type BrandLogoProps = {
  href?: string | null;
  className?: string;
  /** Compact for headers; larger for login/marketing */
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { box: "h-11 w-[8.75rem]", width: 280, height: 280 },
  md: { box: "h-16 w-[12rem]", width: 400, height: 400 },
  lg: { box: "h-32 w-[16rem]", width: 560, height: 560 },
};

export function BrandLogo({ href = "/", className, size = "sm" }: BrandLogoProps) {
  const dims = sizeMap[size];

  const mark = (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl",
        dims.box
      )}
    >
      <Image
        src="/brand/klikmoment-logo.png"
        alt={sr.brand}
        width={dims.width}
        height={dims.height}
        className="h-full w-full object-contain"
        priority={size !== "lg"}
      />
    </span>
  );

  if (href === null) {
    return <span className={cn("inline-flex shrink-0", className)}>{mark}</span>;
  }

  return (
    <Link href={href} className={cn("inline-flex shrink-0", className)} aria-label={sr.brand}>
      {mark}
    </Link>
  );
}
