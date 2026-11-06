"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Hand, Globe, Languages, Type, Accessibility } from "lucide-react";
import { useKiosk, useWheelchairMode } from "@/hooks/use-kiosk";
import { t } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

/** Fixed desktop chrome — no viewport breakpoints (those jump when browser zoom changes). */
export function BottomNav() {
  const pathname = usePathname();
  const { language, setLanguage, largeText, setLargeText } = useKiosk();
  const { wheelchairMode, setWheelchairMode } = useWheelchairMode();

  return (
    <footer className="kiosk-bottom-nav h-20 shrink-0 bg-kiosk-navy text-white">
      <div className="kiosk-bottom-nav__row flex h-full items-center justify-between gap-3 px-7">
        <Link
          href="/"
          className={cn(
            "kiosk-bottom-nav__home flex shrink-0 items-center gap-2.5 rounded-full px-6 py-3 text-lg font-bold transition-all",
            pathname === "/"
              ? "bg-kiosk-green text-white shadow-lg"
              : "bg-kiosk-green/80 text-white hover:bg-kiosk-green"
          )}
        >
          <Home className="h-6 w-6" />
          {t(language, "home")}
        </Link>

        <div className="kiosk-bottom-nav__hint flex items-center gap-2.5 text-lg text-white/80">
          <Hand className="h-6 w-6 shrink-0" />
          <span className="tracking-wide font-medium whitespace-nowrap">{t(language, "tapToExplore")}</span>
        </div>

        <div className="kiosk-bottom-nav__actions flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setLanguage("en")}
            aria-label={t(language, "english")}
            className={cn(
              "kiosk-bottom-nav__button flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors",
              language === "en" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
            )}
          >
            <Globe className="h-5 w-5 shrink-0" />
            <span className="kiosk-bottom-nav__label">{t(language, "english")}</span>
            <span className="kiosk-bottom-nav__short" aria-hidden>EN</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage("fil")}
            aria-label={t(language, "filipino")}
            className={cn(
              "kiosk-bottom-nav__button flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors",
              language === "fil" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
            )}
          >
            <Languages className="h-5 w-5 shrink-0" />
            <span className="kiosk-bottom-nav__label">{t(language, "filipino")}</span>
            <span className="kiosk-bottom-nav__short" aria-hidden>FIL</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage("bis")}
            aria-label={t(language, "cebuano")}
            className={cn(
              "kiosk-bottom-nav__button flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-semibold transition-colors",
              language === "bis" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
            )}
          >
            <Languages className="h-5 w-5 shrink-0" />
            <span className="kiosk-bottom-nav__label">{t(language, "cebuano")}</span>
            <span className="kiosk-bottom-nav__short" aria-hidden>CEB</span>
          </button>

          <div className="kiosk-bottom-nav__divider mx-2.5 h-8 w-px bg-white/20" />

          <button
            type="button"
            onClick={() => setLargeText(!largeText)}
            className={cn(
              "kiosk-bottom-nav__button flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-semibold whitespace-nowrap transition-colors",
              largeText ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
            )}
            aria-pressed={largeText}
            title={t(language, "largeText")}
          >
            <Type className="h-5 w-5 shrink-0" />
            <span>{t(language, "largeText")}</span>
          </button>
          <button
            type="button"
            onClick={() => setWheelchairMode(!wheelchairMode)}
            className={cn(
              "kiosk-bottom-nav__button flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-base font-semibold whitespace-nowrap transition-colors",
              wheelchairMode ? "bg-kiosk-green text-white" : "text-white/60 hover:text-white"
            )}
            aria-pressed={wheelchairMode}
            title={t(language, "accessibility")}
          >
            <Accessibility className="h-5 w-5 shrink-0" />
            <span>{t(language, "accessibility")}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
