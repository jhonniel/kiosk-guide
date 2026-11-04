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
      titleBis="Balita ug Pahibalo"
      descriptionEn="Latest advisories, programs, and public notices."
      descriptionFil="Pinakabagong mga paalala, programa, at pampublikong abiso."
      descriptionBis="Pinakabag-ong mga pahimangno, programa, ug pahibalo sa publiko."
      fit
    >
      <NewsClient announcements={getSortedAnnouncements(data)} />
    </ModulePageClient>
  );
}
