"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedAnnouncements } from "@/features/offline/selectors";
import { NewsClient } from "./news-client";

export default function NewsPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      icon="Megaphone"
      titleEn="News & Announcements"
      titleFil="Balita at Anunsyo"
      descriptionEn="Latest advisories, programs, and public notices."
      descriptionFil="Pinakabagong mga abiso, programa, at pampublikong paunawa."
    >
      <NewsClient announcements={getSortedAnnouncements(data)} />
    </ModulePageClient>
  );
}
