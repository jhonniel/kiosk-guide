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
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-sm font-bold tracking-wider text-kiosk-navy">{t(language, "quickAccess")}</h2>
        <div className="h-0.5 w-8 bg-kiosk-green" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
          >
            <item.icon className="h-5 w-5 text-kiosk-navy" />
            <span className="font-semibold text-kiosk-navy">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
