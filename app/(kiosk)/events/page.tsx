"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKiosk } from "@/hooks/use-kiosk";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedEvents } from "@/features/offline/selectors";
import { pickLang } from "@/lib/i18n/translations";
import { EventsClient } from "./events-client";

export default function EventsPage() {
  const { language } = useKiosk();
  const data = useKioskOfflineData();
  const events = getSortedEvents(data);

  return (
    <ModulePageClient
      icon="Calendar"
      titleEn="Events Calendar"
      titleFil="Kalendaryo ng mga Kaganapan"
      titleBis="Kalendaryo sa mga Kalihokan"
      descriptionEn="Browse the public schedule. Colors on the calendar match event categories in the timeline."
      descriptionFil="Tingnan ang pampublikong iskedyul. Ang kulay sa kalendaryo ay tumutugma sa kategorya sa timeline."
      descriptionBis="Tan-awa ang iskedyul alang sa publiko. Ang kolor sa kalendaryo mohaom sa kategorya sa timeline."
      bannerMeta={pickLang(
        language,
        "Public schedule · Tap an event for details",
        "Pampublikong iskedyul · Pindutin ang kaganapan para sa detalye",
        "Iskedyul alang sa publiko · Pindota ang kalihokan para sa detalye"
      )}
      fit
    >
      <EventsClient events={events} />
    </ModulePageClient>
  );
}
