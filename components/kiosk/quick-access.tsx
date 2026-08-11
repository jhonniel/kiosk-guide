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
      <div className="mb-2 flex items-center gap-3">
        <h2 className="text-sm font-bold tracking-wider text-kiosk-navy">
          {t(language, "quickAccess")}
        </h2>
        <div className="h-0.5 w-8 bg-kiosk-green" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-0 min-w-0 items-center justify-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-md transition-shadow duration-200 hover:shadow-lg active:brightness-95"
          >
            <item.icon className="h-5 w-5 shrink-0 text-kiosk-navy" />
            <span className="truncate text-base font-semibold text-kiosk-navy">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
