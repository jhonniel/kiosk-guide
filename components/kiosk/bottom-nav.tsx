"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Hand, Globe, Languages, Type, Accessibility } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { t } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

/** Fixed desktop chrome — no viewport breakpoints (those jump when browser zoom changes). */
export function BottomNav() {
  const pathname = usePathname();
  const { language, setLanguage, largeText, setLargeText, highContrast, setHighContrast } = useKiosk();

  return (
    <footer className="flex h-20 shrink-0 items-center justify-between gap-3 overflow-x-auto bg-kiosk-navy px-7 text-white">
      <Link
        href="/"
        className={cn(
          "flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-lg font-bold transition-all",
          pathname === "/"
            ? "bg-kiosk-green text-white shadow-lg"
            : "bg-kiosk-green/80 text-white hover:bg-kiosk-green"
        )}
      >
        <Home className="h-6 w-6" />
        {t(language, "home")}
      </Link>

      <div className="flex items-center gap-2.5 text-lg text-white/80">
        <Hand className="h-6 w-6" />
        <span className="tracking-wide font-medium">{t(language, "tapToExplore")}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors",
            language === "en" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Globe className="h-5 w-5" />
          <span>{t(language, "english")}</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage("fil")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors",
            language === "fil" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Languages className="h-5 w-5" />
          <span>{t(language, "filipino")}</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage("bis")}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors",
            language === "bis" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Languages className="h-5 w-5" />
          <span>{t(language, "cebuano")}</span>
        </button>

        <div className="mx-2.5 h-8 w-px bg-white/20" />

        <button
          type="button"
          onClick={() => setLargeText(!largeText)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors",
            largeText ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
          aria-pressed={largeText}
          title={t(language, "largeText")}
        >
          <Type className="h-5 w-5" />
          <span>{t(language, "largeText")}</span>
        </button>
        <button
          type="button"
          onClick={() => setHighContrast(!highContrast)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors",
            highContrast ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
          aria-pressed={highContrast}
          title={t(language, "accessibility")}
        >
          <Accessibility className="h-5 w-5" />
          <span>{t(language, "accessibility")}</span>
        </button>
      </div>
    </footer>
  );
}
