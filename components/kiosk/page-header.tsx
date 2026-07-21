"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DateTimeWidget } from "@/components/kiosk/date-time-widget";
import { t, type Language } from "@/lib/i18n/translations";

interface PageHeaderProps {
  title: string;
  language: Language;
  description?: string;
  showBack?: boolean;
}

export function PageHeader({
  title,
  language,
  description,
  showBack = true,
}: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-30 -mx-8 mb-6 border-b border-transparent bg-kiosk-bg/95 px-8 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-kiosk-bg/85">
      <div className="flex items-start justify-between gap-4">
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
