"use client";

import { KioskBackButton } from "@/components/kiosk/kiosk-back-button";
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
  const backLabel = t(language, "backToHome");

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
        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
          {showBack ? <KioskBackButton href="/">{backLabel}</KioskBackButton> : null}
          <h1 className="min-w-0 truncate text-xl font-bold tracking-tight text-kiosk-navy sm:text-2xl lg:text-3xl">
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
        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
          {showBack ? <KioskBackButton href="/">{backLabel}</KioskBackButton> : null}
          <h1 className="min-w-0 truncate text-3xl font-bold tracking-tight text-kiosk-navy">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="mt-1 line-clamp-2 text-base text-gray-600">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
