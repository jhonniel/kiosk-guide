"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedEvents } from "@/features/offline/selectors";
import { EventsClient } from "./events-client";

export default function EventsPage() {
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
      descriptionBis="Tan-awa ang pampublikong iskedyul. Ang kolor sa kalendaryo mohaum sa kategorya sa timeline."
      bannerMeta="Public schedule · Tap an event for details"
      fit
    >
      <EventsClient events={events} />
    </ModulePageClient>
  );
}
