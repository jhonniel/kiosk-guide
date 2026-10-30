"use client";

import { Loader2 } from "lucide-react";
import { pickLang } from "@/lib/i18n/translations";

type Props = {
  language: "en" | "fil" | "bis";
};

export function MapWarmupOverlay({ language }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#5eb0cc]/95 text-kiosk-navy backdrop-blur-sm">
      <Loader2 className="h-10 w-10 animate-spin text-kiosk-navy/80" aria-hidden />
      <p className="text-sm font-semibold">
        {pickLang(
          language,
          "Preparing Camiguin map…",
          "Inihahanda ang mapa ng Camiguin…",
          "Giandam ang mapa sa Camiguin…"
        )}
      </p>
      <p className="max-w-xs px-4 text-center text-xs text-kiosk-navy/75">
        {pickLang(
          language,
          "Loading graphics for smooth zoom and pan.",
          "Nilo-load ang graphics para sa maayos na zoom at galaw.",
          "Nag-load ang graphics aron hapsay ang zoom ug galaw."
        )}
      </p>
    </div>
  );
}
