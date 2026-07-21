"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { OfficeHoursClient } from "./office-hours-client";

export default function OfficeHoursPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      icon="Clock"
      titleEn="Office Hours"
      titleFil="Oras ng Opisina"
      descriptionEn="Provincial government office operating hours."
      descriptionFil="Mga oras ng operasyon ng tanggapan ng pamahalaang panlalawigan."
    >
      <OfficeHoursClient settings={data.settings} />
    </ModulePageClient>
  );
}
