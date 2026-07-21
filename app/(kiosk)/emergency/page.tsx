"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedEmergency } from "@/features/offline/selectors";
import { EmergencyClient } from "./emergency-client";

export default function EmergencyPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      icon="Phone"
      titleEn="Emergency Contacts"
      titleFil="Mga Contact sa Emergency"
      descriptionEn="Hotlines for police, fire, health, and rescue."
      descriptionFil="Mga hotline para sa pulis, bumbero, kalusugan, at rescue."
    >
      <EmergencyClient contacts={getSortedEmergency(data)} />
    </ModulePageClient>
  );
}
