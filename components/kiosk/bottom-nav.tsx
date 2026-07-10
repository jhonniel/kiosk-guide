"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Hand, Globe, Languages, Type, Accessibility } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { t } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { language, setLanguage, largeText, setLargeText, highContrast, setHighContrast } = useKiosk();

  return (
    <footer className="flex h-16 shrink-0 items-center justify-between bg-kiosk-navy px-6 text-white">
      <Link
        href="/"
        className={cn(
          "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all",
          pathname === "/"
            ? "bg-kiosk-green text-white shadow-lg"
            : "bg-kiosk-green/80 text-white hover:bg-kiosk-green"
        )}
      >
        <Home className="h-4 w-4" />
        {t(language, "home")}
      </Link>

      <div className="flex items-center gap-2 text-sm text-white/70">
        <Hand className="h-4 w-4" />
        <span className="tracking-wide">{t(language, "tapToExplore")}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
            language === "en" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          {t(language, "english")}
        </button>
        <button
          type="button"
          onClick={() => setLanguage("fil")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
            language === "fil" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Languages className="h-3.5 w-3.5" />
          {t(language, "filipino")}
        </button>
        <button
          type="button"
          onClick={() => setLanguage("bis")}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
            language === "bis" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Languages className="h-3.5 w-3.5" />
          {t(language, "cebuano")}
        </button>

        <div className="mx-2 h-6 w-px bg-white/20" />

        <button
          type="button"
          onClick={() => setLargeText(!largeText)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
            largeText ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
          aria-pressed={largeText}
        >
          <Type className="h-3.5 w-3.5" />
          {t(language, "largeText")}
        </button>
        <button
          type="button"
          onClick={() => setHighContrast(!highContrast)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
            highContrast ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
          aria-pressed={highContrast}
        >
          <Accessibility className="h-3.5 w-3.5" />
          {t(language, "accessibility")}
        </button>
      </div>
    </footer>
  );
}
