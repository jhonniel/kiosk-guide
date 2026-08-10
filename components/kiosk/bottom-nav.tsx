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
    <footer className="flex h-16 shrink-0 items-center justify-between gap-3 overflow-x-auto bg-kiosk-navy px-4 text-white sm:h-[4.5rem] sm:px-5 lg:h-20 lg:px-7">
      <Link
        href="/"
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all sm:gap-2.5 sm:px-5 sm:py-3 sm:text-base lg:px-6 lg:text-lg",
          pathname === "/"
            ? "bg-kiosk-green text-white shadow-lg"
            : "bg-kiosk-green/80 text-white hover:bg-kiosk-green"
        )}
      >
        <Home className="h-5 w-5 sm:h-6 sm:w-6" />
        {t(language, "home")}
      </Link>

      <div className="hidden items-center gap-2.5 text-base text-white/80 lg:flex lg:text-lg">
        <Hand className="h-5 w-5 lg:h-6 lg:w-6" />
        <span className="tracking-wide font-medium">{t(language, "tapToExplore")}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm lg:text-base",
            language === "en" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">{t(language, "english")}</span>
          <span className="sm:hidden">EN</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage("fil")}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm lg:text-base",
            language === "fil" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Languages className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">{t(language, "filipino")}</span>
          <span className="sm:hidden">FIL</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage("bis")}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm lg:text-base",
            language === "bis" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Languages className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">{t(language, "cebuano")}</span>
          <span className="sm:hidden">BIS</span>
        </button>

        <div className="mx-1.5 hidden h-8 w-px bg-white/20 sm:mx-2.5 sm:block" />

        <button
          type="button"
          onClick={() => setLargeText(!largeText)}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm lg:text-base",
            largeText ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
          aria-pressed={largeText}
          title={t(language, "largeText")}
        >
          <Type className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden md:inline">{t(language, "largeText")}</span>
        </button>
        <button
          type="button"
          onClick={() => setHighContrast(!highContrast)}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm lg:text-base",
            highContrast ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
          aria-pressed={highContrast}
          title={t(language, "accessibility")}
        >
          <Accessibility className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden md:inline">{t(language, "accessibility")}</span>
        </button>
      </div>
    </footer>
  );
}
