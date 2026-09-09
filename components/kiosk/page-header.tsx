"use client";

import { KioskBackButton } from "@/components/kiosk/kiosk-back-button";
import {
  kioskDateTimeReserveClass,
  kioskTopBarHeightClass,
} from "@/components/kiosk/date-time-widget";
import { t, type Language } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  language: Language;
  description?: string;
  showBack?: boolean;
  /** When false, only the back control is shown (e.g. banner already displays the title). */
  showTitle?: boolean;
  compact?: boolean;
  /** Let a page-level scenic background show through (home / charter-style headers). */
  transparent?: boolean;
}

export function PageHeader({
  title,
  language,
  description,
  showBack = true,
  showTitle = true,
  compact = false,
  transparent = false,
}: PageHeaderProps) {
  const backLabel = t(language, "backToHome");

  if (compact) {
    return (
      <header
        className={cn(
          "flex shrink-0 items-center border-b",
          kioskTopBarHeightClass,
          kioskDateTimeReserveClass,
          transparent
            ? "border-transparent bg-transparent"
            : "border-gray-200/60 bg-kiosk-bg/95 backdrop-blur-sm supports-[backdrop-filter]:bg-kiosk-bg/85"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          {showBack ? <KioskBackButton href="/">{backLabel}</KioskBackButton> : null}
          {showTitle ? (
            <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight text-kiosk-navy">
              {title}
            </h1>
          ) : null}
        </div>
      </header>
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
