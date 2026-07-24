"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DateTimeWidget } from "@/components/kiosk/date-time-widget";
import { t, type Language } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  language: Language;
  description?: string;
  showBack?: boolean;
  compact?: boolean;
  /** Let a page-level scenic background show through (home / charter-style headers). */
  transparent?: boolean;
}

export function PageHeader({
  title,
  language,
  description,
  showBack = true,
  compact = false,
  transparent = false,
}: PageHeaderProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "sticky top-0 z-30 -mx-8 mb-5 border-b px-8 py-3",
          transparent
            ? "border-transparent bg-transparent"
            : "border-gray-200/60 bg-kiosk-bg/95 backdrop-blur-sm supports-[backdrop-filter]:bg-kiosk-bg/85"
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {showBack && (
              <Link
                href="/"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-kiosk-navy shadow-sm ring-1 ring-gray-200 transition hover:bg-kiosk-navy hover:text-white"
                aria-label={t(language, "backToHome")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            <h1 className="truncate text-2xl font-bold tracking-tight text-kiosk-navy lg:text-3xl">
              {title}
            </h1>
          </div>
          <div className="shrink-0">
            <DateTimeWidget />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-30 -mx-8 mb-6 border-b px-8 py-4",
        transparent
          ? "border-transparent bg-transparent"
          : "border-transparent bg-kiosk-bg/95 backdrop-blur-sm supports-[backdrop-filter]:bg-kiosk-bg/85"
      )}
    >
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 pr-2">
          {showBack && (
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-kiosk-navy/70 transition-colors hover:text-kiosk-navy"
            >
              <ArrowLeft className="h-4 w-4" />
              {t(language, "backToHome")}
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-kiosk-navy lg:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-gray-600">{description}</p>}
        </div>
        <div className="shrink-0 self-center">
          <DateTimeWidget />
        </div>
      </div>
    </div>
  );
}
