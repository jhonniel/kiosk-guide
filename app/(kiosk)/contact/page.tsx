"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { ContactClient } from "./contact-client";

export default function ContactPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      titleEn="Contact Us"
      titleFil="Makipag-ugnayan"
      descriptionEn="Get in touch with the Provincial Government of Camiguin."
      descriptionFil="Makipag-ugnayan sa Pamahalaang Panlalawigan ng Camiguin."
    >
      <ContactClient settings={data.settings} />
    </ModulePageClient>
  );
}
