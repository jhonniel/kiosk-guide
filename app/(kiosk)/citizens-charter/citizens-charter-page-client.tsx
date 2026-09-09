"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { CharterEditionView } from "@/features/citizens-charter/types";
import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useCitizensCharterEdition } from "@/hooks/use-citizens-charter-data";

const CitizensCharterClient = dynamic(
  () =>
    import("./citizens-charter-client").then((module) => ({
      default: module.CitizensCharterClient,
    })),
  {
    loading: () => (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-kiosk-navy">
        <Loader2 className="h-8 w-8 animate-spin text-kiosk-green" />
        <p className="text-sm text-gray-500">Loading Citizens&apos; Charter…</p>
      </div>
    ),
  }
);

type CitizensCharterPageClientProps = {
  initialEdition: CharterEditionView | null;
};

export function CitizensCharterPageClient({ initialEdition }: CitizensCharterPageClientProps) {
  const { edition, isLoading, error } = useCitizensCharterEdition(initialEdition);

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
      hideBanner
      hideHeader
      fit
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
