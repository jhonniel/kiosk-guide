"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { kioskDateTimeReserveClass } from "@/components/kiosk/date-time-widget";
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
          "sticky top-0 z-30 -mx-4 mb-3 border-b px-4 py-2.5 sm:-mx-6 sm:mb-4 sm:px-6 sm:py-3 lg:-mx-8 lg:mb-5 lg:px-8",
          kioskDateTimeReserveClass,
          transparent
            ? "border-transparent bg-transparent"
            : "border-gray-200/60 bg-kiosk-bg/95 backdrop-blur-sm supports-[backdrop-filter]:bg-kiosk-bg/85"
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          {showBack && (
            <Link
              href="/"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-kiosk-navy shadow-sm ring-1 ring-gray-200 transition hover:bg-kiosk-navy hover:text-white sm:h-10 sm:w-10"
              aria-label={t(language, "backToHome")}
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          )}
          <h1 className="truncate text-xl font-bold tracking-tight text-kiosk-navy sm:text-2xl lg:text-3xl">
            {title}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative z-30 mb-3 border-b py-3",
        kioskDateTimeReserveClass,
        transparent
          ? "border-transparent bg-transparent"
          : "border-transparent bg-kiosk-bg/95 backdrop-blur-sm supports-[backdrop-filter]:bg-kiosk-bg/85"
      )}
    >
      <div className="relative z-10 min-w-0 flex-1 pr-2">
        {showBack && (
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-kiosk-navy/70 transition-colors hover:text-kiosk-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(language, "backToHome")}
          </Link>
        )}
        <h1 className="truncate text-3xl font-bold tracking-tight text-kiosk-navy">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 line-clamp-2 text-base text-gray-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
