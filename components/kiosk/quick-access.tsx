import Link from "next/link";
import { Clock, Phone, Star } from "lucide-react";
import { t, type Language } from "@/lib/i18n/translations";

interface QuickAccessProps {
  language: Language;
}

export function QuickAccess({ language }: QuickAccessProps) {
  const items = [
    { href: "/office-hours", icon: Clock, label: t(language, "officeHours") },
    { href: "/contact", icon: Phone, label: t(language, "contactUs") },
    { href: "/feedback", icon: Star, label: t(language, "feedback") },
  ];

  return (
    <div className="shrink-0">
      <div className="mb-2 flex items-center gap-2 sm:mb-2.5 sm:gap-3">
        <h2 className="text-xs font-bold tracking-wider text-kiosk-navy sm:text-sm">
          {t(language, "quickAccess")}
        </h2>
        <div className="h-0.5 w-8 bg-kiosk-green" />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-2xl bg-white px-2 py-2.5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] sm:gap-3 sm:px-4 sm:py-3.5 lg:px-6"
          >
            <item.icon className="h-4 w-4 shrink-0 text-kiosk-navy sm:h-5 sm:w-5" />
            <span className="truncate text-xs font-semibold text-kiosk-navy sm:text-sm lg:text-base">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
