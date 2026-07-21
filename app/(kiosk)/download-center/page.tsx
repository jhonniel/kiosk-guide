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
      icon="Download"
      titleEn="Download Center"
      titleFil="Sentro ng Pag-download"
      titleBis="Sentro sa Pag-download"
      descriptionEn="Scan the QR code to download forms, permit templates and public brochures."
      descriptionFil="I-scan ang QR code para i-download ang mga form, permit template at pampublikong brochure."
      descriptionBis="I-scan ang QR code aron makadownload og mga form, permit template ug pampublikong brochure."
    >
      <DownloadCenterClient
        downloads={getSortedDownloads(data)}
        deliverySettings={deliverySettings}
      />
    </ModulePageClient>
  );
}
