"use client";

import { Compass as CompassIcon } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang } from "@/lib/i18n/translations";

export function Compass() {
  const { language } = useKiosk();
  const north = pickLang(language, "North", "Hilaga", "Amihanan");
  return (
    <div
      className="pointer-events-none flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/80 shadow-lg backdrop-blur-md"
      aria-label={north}
      title={north}
    >
      <div className="relative flex h-9 w-9 items-center justify-center">
        <CompassIcon className="h-7 w-7 text-kiosk-navy" />
        <span className="absolute top-0 text-[9px] font-black text-rose-600">N</span>
      </div>
    </div>
  );
}
