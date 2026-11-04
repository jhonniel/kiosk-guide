"use client";

import { Accessibility, ArrowDown } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

/** Fills the top of the screen while the kiosk is lowered for wheelchair reach. */
export function KioskLoweredBanner({ leaving = false }: { leaving?: boolean }) {
  const { language } = useKiosk();

  return (
    <div className={cn("kiosk-lowered-banner", leaving && "kiosk-lowered-banner-out")} aria-live="polite">
      <div className="flex max-w-3xl flex-col items-center gap-4 px-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-kiosk-green text-white shadow-lg">
          <Accessibility className="h-9 w-9" />
        </span>
        <div>
          <p className="text-2xl font-bold text-white">
            {pickLang(language, "Wheelchair mode", "Mode para sa Wheelchair", "Mode alang sa Wheelchair")}
          </p>
          <p className="mt-1.5 text-lg text-white/85">
            {pickLang(
              language,
              "The screen has been lowered so everything is within easy reach.",
              "Ibinaba ang screen para abot-kamay ang lahat.",
              "Gipaubos ang screen aron sayon maabot ang tanan."
            )}
          </p>
          <p className="mt-1 text-base text-white/70">
            {pickLang(
              language,
              "Tap Accessibility again to use the full screen.",
              "Pindutin muli ang Accessibility para gamitin ang buong screen.",
              "Pindota pag-usab ang Accessibility aron gamiton ang tibuok screen."
            )}
          </p>
        </div>
        <ArrowDown className="kiosk-scroll-hint-badge h-7 w-7 text-white/70" aria-hidden />
      </div>
    </div>
  );
}
