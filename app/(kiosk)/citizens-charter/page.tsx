"use client";

import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useCitizensCharterEdition } from "@/hooks/use-citizens-charter-data";
import { CitizensCharterClient } from "./citizens-charter-client";

export default function CitizensCharterPage() {
  const { edition, isLoading, error } = useCitizensCharterEdition();

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
      {isLoading && !edition ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-kiosk-navy">
          <Loader2 className="h-8 w-8 animate-spin text-kiosk-green" />
          <p className="text-sm text-gray-500">Loading Citizens&apos; Charter…</p>
        </div>
      ) : error && !edition ? (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
          {error}
        </div>
      ) : (
        <CitizensCharterClient edition={edition} />
      )}
    </ModulePageClient>
  );
}
