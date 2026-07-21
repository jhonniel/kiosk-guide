"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedEvents } from "@/features/offline/selectors";
import { EventsClient } from "./events-client";

export default function EventsPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      icon="Calendar"
      titleEn="Events Calendar"
      titleFil="Kalendaryo ng mga Kaganapan"
      descriptionEn="Upcoming festivals, meetings, and activities."
      descriptionFil="Mga paparating na festival, pagpupulong, at aktibidad."
    >
      <EventsClient events={getSortedEvents(data)} />
    </ModulePageClient>
  );
}
