"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getSortedDownloads } from "@/features/offline/selectors";
import { buildDownloadDeliverySettings } from "@/features/downloads/download-settings";
import { useKiosk } from "@/hooks/use-kiosk";
import { DownloadCenterClient } from "./download-center-client";

export default function DownloadCenterPage() {
  const data = useKioskOfflineData();
  const { language } = useKiosk();
  const deliverySettings = buildDownloadDeliverySettings(data.settings, language);

  return (
    <ModulePageClient
      titleEn="Download Center"
      titleFil="Sentro ng Pag-download"
      titleBis="Sentro sa Pag-download"
    >
      <DownloadCenterClient
        downloads={getSortedDownloads(data)}
        deliverySettings={deliverySettings}
      />
    </ModulePageClient>
  );
}
