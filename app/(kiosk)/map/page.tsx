"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getMapMarkersFromOffline } from "@/features/offline/selectors";
import { MapClient } from "./map-client";

export default function MapPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      titleEn="Map of Camiguin"
      titleFil="Mapa ng Camiguin"
      titleBis="Mapa sa Camiguin"
      descriptionEn="Explore the island map, pinch to zoom, and tap tourist spots for details."
      descriptionFil="Tuklasin ang mapa ng isla, i-pinch para mag-zoom, at pindutin ang mga tourist spot para sa detalye."
      descriptionBis="Suhola ang mapa sa isla, i-pinch aron mag-zoom, ug pindota ang mga tourist spot para sa detalye."
    >
      <MapClient markers={getMapMarkersFromOffline(data)} />
    </ModulePageClient>
  );
}
