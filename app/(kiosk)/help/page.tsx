"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedServices } from "@/features/offline/selectors";
import { HelpClient } from "./help-client";

export default function HelpPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      icon="HelpCircle"
      titleEn="I Need Help With..."
      titleFil="Kailangan Ko ng Tulong sa..."
      descriptionEn="Guided assistance for common requests."
      descriptionFil="Gabay na tulong para sa mga karaniwang kahilingan."
    >
      <HelpClient services={getSortedServices(data)} />
    </ModulePageClient>
  );
}
