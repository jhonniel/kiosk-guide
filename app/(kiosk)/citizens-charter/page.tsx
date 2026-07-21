"use client";

import { ExternalLink, FileText } from "lucide-react";
import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { CitizensCharterClient } from "./citizens-charter-client";

export default function CitizensCharterPage() {
  const data = useKioskOfflineData();
  const edition = data.citizensCharter ?? null;

  return (
    <ModulePageClient
      icon="FileText"
      titleEn="Citizens' Charter"
      titleFil="Citizens' Charter"
      titleBis="Citizens' Charter"
      descriptionEn={
        edition?.description ||
        "Complete list of services from the published Citizens' Charter edition."
      }
      descriptionFil="Kumpletong listahan ng mga serbisyo mula sa Citizens' Charter."
      descriptionBis="Kompletong lista sa mga serbisyo gikan sa Citizens' Charter."
      bannerMeta={
        edition
          ? `${edition.serviceCount} services · ${edition.offices.length} offices`
          : undefined
      }
      bannerAction={
        edition?.pdfUrl ? (
          <a
            href={edition.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-kiosk-navy shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileText className="h-5 w-5" />
            View Full Charter
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : undefined
      }
    >
      <CitizensCharterClient edition={edition} />
    </ModulePageClient>
  );
}
