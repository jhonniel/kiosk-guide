"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedEmergency } from "@/features/offline/selectors";
import { EmergencyClient } from "./emergency-client";

export default function EmergencyPage() {
  const data = useKioskOfflineData();
  const contacts = getSortedEmergency(data);

  return (
    <ModulePageClient
      icon="Phone"
      titleEn="Emergency Contacts"
      titleFil="Mga Contact sa Emergency"
      descriptionEn="Official hotline numbers for Camiguin province and municipalities."
      descriptionFil="Opisyal na mga hotline number para sa probinsya at mga munisipyo ng Camiguin."
      descriptionBis="Opisyal nga mga hotline number para sa probinsya ug mga lungsod sa Camiguin."
      bannerMeta={`${contacts.length} hotlines · Province + 5 municipalities`}
    >
      <EmergencyClient contacts={contacts} />
    </ModulePageClient>
  );
}
