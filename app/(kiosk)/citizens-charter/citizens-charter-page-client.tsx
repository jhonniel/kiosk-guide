"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { CharterEditionView } from "@/features/citizens-charter/types";
import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useCitizensCharterEdition } from "@/hooks/use-citizens-charter-data";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang } from "@/lib/i18n/translations";

function CharterLoading() {
  const { language } = useKiosk();
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-kiosk-navy">
      <Loader2 className="h-8 w-8 animate-spin text-kiosk-green" />
      <p className="text-sm text-gray-500">
        {pickLang(
          language,
          "Loading Citizens' Charter…",
          "Naglo-load ang Citizens' Charter…",
          "Nagkarga ang Citizens' Charter…"
        )}
      </p>
    </div>
  );
}

const CitizensCharterClient = dynamic(
  () =>
    import("./citizens-charter-client").then((module) => ({
      default: module.CitizensCharterClient,
    })),
  {
    loading: () => <CharterLoading />,
  }
);

type CitizensCharterPageClientProps = {
  initialEdition: CharterEditionView | null;
};

export function CitizensCharterPageClient({ initialEdition }: CitizensCharterPageClientProps) {
  const { language } = useKiosk();
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
      descriptionFil="Kumpletong listahan ng mga serbisyo mula sa nakalathalang edisyon ng Citizens' Charter."
      descriptionBis="Kompletong listahan sa mga serbisyo gikan sa gipatik nga edisyon sa Citizens' Charter."
      hideBanner
      hideHeader
      fit
    >
      {isLoading && !edition ? (
        <CharterLoading />
      ) : error && !edition ? (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
          {pickLang(
            language,
            error,
            "Hindi ma-load ang Citizens' Charter. Pakisubukang muli mamaya.",
            "Dili makarga ang Citizens' Charter. Palihug sulayi pag-usab unya."
          )}
        </div>
      ) : (
        <CitizensCharterClient edition={edition} />
      )}
    </ModulePageClient>
  );
}
