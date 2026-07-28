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
    <footer className="flex h-12 shrink-0 items-center justify-between gap-2 overflow-x-auto bg-kiosk-navy px-3 text-white sm:h-14 sm:px-4 lg:h-16 lg:px-6">
      <Link
        href="/"
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition-all sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm lg:px-5",
          pathname === "/"
            ? "bg-kiosk-green text-white shadow-lg"
            : "bg-kiosk-green/80 text-white hover:bg-kiosk-green"
        )}
      >
        <Home className="h-4 w-4" />
        {t(language, "home")}
      </Link>

      <div className="hidden items-center gap-2 text-sm text-white/70 lg:flex">
        <Hand className="h-4 w-4" />
        <span className="tracking-wide">{t(language, "tapToExplore")}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs",
            language === "en" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t(language, "english")}</span>
          <span className="sm:hidden">EN</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage("fil")}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs",
            language === "fil" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Languages className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t(language, "filipino")}</span>
          <span className="sm:hidden">FIL</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage("bis")}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs",
            language === "bis" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
        >
          <Languages className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t(language, "cebuano")}</span>
          <span className="sm:hidden">BIS</span>
        </button>

        <div className="mx-1 hidden h-6 w-px bg-white/20 sm:mx-2 sm:block" />

        <button
          type="button"
          onClick={() => setLargeText(!largeText)}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs",
            largeText ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
          aria-pressed={largeText}
          title={t(language, "largeText")}
        >
          <Type className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{t(language, "largeText")}</span>
        </button>
        <button
          type="button"
          onClick={() => setHighContrast(!highContrast)}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors sm:gap-1.5 sm:px-3 sm:py-2 sm:text-xs",
            highContrast ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
          )}
          aria-pressed={highContrast}
          title={t(language, "accessibility")}
        >
          <Accessibility className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{t(language, "accessibility")}</span>
        </button>
      </div>
    </footer>
  );
}
