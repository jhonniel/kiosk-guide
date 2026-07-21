"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getGovernmentDirectoriesFromOffline } from "@/features/offline/selectors";
import { GovernmentDirectoryClient } from "./government-directory-client";

export default function GovernmentDirectoryPage() {
  const data = useKioskOfflineData();

  return (
    <ModulePageClient
      icon="Users"
      titleEn="Government Directory"
      titleFil="Direktoryo ng Pamahalaan"
      descriptionEn="Departments, officials, and contact information."
      descriptionFil="Mga departamento, opisyal, at impormasyon sa pakikipag-ugnayan."
    >
      <GovernmentDirectoryClient directories={getGovernmentDirectoriesFromOffline(data)} />
    </ModulePageClient>
  );
}
