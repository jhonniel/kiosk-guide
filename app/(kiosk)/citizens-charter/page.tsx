"use client";

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
    >
      <CitizensCharterClient edition={edition} />
    </ModulePageClient>
  );
}
