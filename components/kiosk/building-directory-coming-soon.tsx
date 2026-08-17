"use client";

import { Building2, Construction } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang } from "@/lib/i18n/translations";

interface BuildingDirectoryComingSoonProps {
  buildingName: string;
}

export function BuildingDirectoryComingSoon({ buildingName }: BuildingDirectoryComingSoonProps) {
  const { language } = useKiosk();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-[min(52vh,520px)] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-kiosk-green/35 bg-gradient-to-b from-white to-green-50/40 px-6 py-10 text-center shadow-md sm:px-10">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-kiosk-green/10 ring-4 ring-kiosk-green/10 sm:h-20 sm:w-20">
          <Building2 className="h-8 w-8 text-kiosk-green sm:h-10 sm:w-10" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-kiosk-green">
          {pickLang(language, "Coming soon", "Malapit na", "Coming soon")}
        </p>

        <h2 className="mt-2 text-xl font-bold text-kiosk-navy sm:text-2xl">
          {pickLang(
            language,
            "3D Building Map & Navigation",
            "3D Mapa ng Gusali at Navigation",
            "3D Building Map ug Navigation"
          )}
        </h2>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
          {pickLang(
            language,
            `Interactive floor plans and turn-by-turn directions for ${buildingName} are being prepared. Please visit the Information Desk for assistance in the meantime.`,
            `Inihahanda ang interactive na floor plan at direksyon para sa ${buildingName}. Mangyaring bisitahin ang Information Desk para sa tulong sa ngayon.`,
            `Gipangandaman ang interactive nga floor plan ug direksyon alang sa ${buildingName}. Palihog bisitaha ang Information Desk alang sa tabang sa karon.`
          )}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-kiosk-navy shadow-sm ring-1 ring-gray-200">
          <Construction className="h-4 w-4 text-amber-500" />
          {pickLang(language, "Under development", "Ginagawa pa", "Gihimo pa")}
        </div>
      </div>
    </div>
  );
}
