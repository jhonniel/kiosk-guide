"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getCitizensCharterPage, getSortedServices } from "@/features/offline/selectors";
import { CitizensCharterClient } from "./citizens-charter-client";

export default function CitizensCharterPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      titleEn="Citizens' Charter"
      titleFil="Citizens' Charter"
      descriptionEn="Service standards, processing times, and requirements."
      descriptionFil="Mga pamantayan ng serbisyo, oras ng pagproseso, at mga kinakailangan."
    >
      <CitizensCharterClient page={getCitizensCharterPage(data)} services={getSortedServices(data)} />
    </ModulePageClient>
  );
}
