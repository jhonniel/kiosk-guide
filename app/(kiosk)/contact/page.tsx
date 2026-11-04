"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { ContactClient } from "./contact-client";

export default function ContactPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      icon="Mail"
      titleEn="Contact Us"
      titleFil="Makipag-ugnayan"
      titleBis="Kontaka Kami"
      descriptionEn="Get in touch with the Provincial Government of Camiguin."
      descriptionFil="Makipag-ugnayan sa Pamahalaang Panlalawigan ng Camiguin."
      descriptionBis="Kontaka ang Provincial Government sa Camiguin."
      fit
    >
      {/* Only the content scrolls; the banner above stays in place. */}
      <div className="kiosk-main-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-1">
        <ContactClient settings={data.settings} />
      </div>
    </ModulePageClient>
  );
}
