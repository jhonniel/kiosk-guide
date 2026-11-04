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
      titleBis="Oras sa Opisina"
      descriptionEn="Provincial government office operating hours."
      descriptionFil="Mga oras ng operasyon ng mga opisina ng pamahalaang panlalawigan."
      descriptionBis="Mga oras sa operasyon sa mga opisina sa provincial nga gobyerno."
      fit
    >
      {/* Only the content scrolls; the banner above stays in place. */}
      <div className="kiosk-main-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1">
        <OfficeHoursClient settings={data.settings} />
      </div>
    </ModulePageClient>
  );
}
