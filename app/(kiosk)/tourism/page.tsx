"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedTourism } from "@/features/offline/selectors";
import { TourismClient } from "./tourism-client";

export default function TourismPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      icon="Palmtree"
      titleEn="Tourism Information"
      titleFil="Impormasyon sa Turismo"
      descriptionEn="Attractions, activities, and travel tips."
      descriptionFil="Mga atraksyon, aktibidad, at mga tip sa paglalakbay."
    >
      <TourismClient items={getSortedTourism(data)} />
    </ModulePageClient>
  );
}
