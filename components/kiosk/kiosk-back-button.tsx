"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export const kioskBackButtonClass =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-kiosk-navy/35 bg-white min-h-[2.75rem] px-5 py-2.5 text-sm font-extrabold tracking-wide text-kiosk-navy shadow-[0_6px_18px_-8px_rgba(26,39,68,0.4)] transition hover:border-kiosk-navy/55 hover:bg-[#eef5ff] hover:shadow-md active:scale-[0.98]";

type KioskBackButtonProps = {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
} & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void }
);

export function KioskBackButton({
  children,
  className,
  href,
  onClick,
  "aria-label": ariaLabel,
}: KioskBackButtonProps) {
  const content = (
    <>
      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(kioskBackButtonClass, className)} aria-label={ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(kioskBackButtonClass, className)}
      aria-label={ariaLabel}
    >
      {content}
    </button>
  );
}
