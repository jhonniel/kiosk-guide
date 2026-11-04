"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKiosk } from "@/hooks/use-kiosk";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedEmergency } from "@/features/offline/selectors";
import { pickLang } from "@/lib/i18n/translations";
import { EmergencyClient } from "./emergency-client";

export default function EmergencyPage() {
  const { language } = useKiosk();
  const data = useKioskOfflineData();
  const contacts = getSortedEmergency(data);

  return (
    <ModulePageClient
      icon="Phone"
      titleEn="Emergency Contacts"
      titleFil="Mga Emergency Contact"
      titleBis="Mga Emergency Contact"
      descriptionEn="Official hotline numbers for Camiguin province and municipalities."
      descriptionFil="Opisyal na mga hotline number para sa probinsya at mga munisipalidad ng Camiguin."
      descriptionBis="Opisyal nga mga hotline number para sa probinsya ug mga lungsod sa Camiguin."
      bannerMeta={pickLang(
        language,
        `${contacts.length} hotlines · Province + 5 municipalities`,
        `${contacts.length} hotline · Probinsya + 5 munisipalidad`,
        `${contacts.length} ka hotline · Probinsya + 5 ka lungsod`
      )}
    >
      <EmergencyClient contacts={contacts} />
    </ModulePageClient>
  );
}
