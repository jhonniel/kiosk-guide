"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { CitizensCharterClient } from "./citizens-charter-client";

export default function CitizensCharterPage() {
  return (
    <ModulePageClient
      titleEn="Citizens' Charter"
      titleFil="Citizens' Charter"
      titleBis="Citizens' Charter"
      descriptionEn="Complete list of services from the 2026 First Edition."
      descriptionFil="Kumpletong listahan ng mga serbisyo mula sa 2026 First Edition."
      descriptionBis="Kompletong lista sa mga serbisyo gikan sa 2026 First Edition."
    >
      <CitizensCharterClient />
    </ModulePageClient>
  );
}
