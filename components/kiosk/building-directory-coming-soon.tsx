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
          {pickLang(language, "Coming soon", "Malapit nang dumating", "Umaabot na")}
        </p>

        <h2 className="mt-2 text-xl font-bold text-kiosk-navy sm:text-2xl">
          {pickLang(
            language,
            "3D Building Map & Navigation",
            "3D na Mapa ng Gusali at Paggabay",
            "3D nga Mapa sa Building ug Paggiya"
          )}
        </h2>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
          {pickLang(
            language,
            `Interactive floor plans and turn-by-turn directions for ${buildingName} are being prepared. Please visit the Information Desk for assistance in the meantime.`,
            `Inihahanda pa ang interactive na floor plan at sunud-sunod na direksyon para sa ${buildingName}. Habang hinihintay, mangyaring pumunta sa Information Desk para sa tulong.`,
            `Giandam pa ang interactive nga floor plan ug sunod-sunod nga direksyon para sa ${buildingName}. Samtang naghulat, palihug adto sa Information Desk para sa tabang.`
          )}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-kiosk-navy shadow-sm ring-1 ring-gray-200">
          <Construction className="h-4 w-4 text-amber-500" />
          {pickLang(language, "Under development", "Ginagawa pa", "Ginahimo pa")}
        </div>
      </div>
    </div>
  );
}
