"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getGovernmentDirectoriesFromOffline } from "@/features/offline/selectors";
import { GovernmentDirectoryClient } from "./government-directory-client";

export default function GovernmentDirectoryPage() {
  const data = useKioskOfflineData();
  const directories = getGovernmentDirectoriesFromOffline(data);

  return (
    <ModulePageClient
      icon="Users"
      titleEn="Government Directory"
      titleFil="Direktoryo ng Pamahalaan"
      descriptionEn="Provincial offices, department heads, and contact numbers."
      descriptionFil="Mga provincial office, department head, at contact number."
      descriptionBis="Mga provincial office, department head, ug contact number."
      bannerMeta={`${directories.length} offices`}
      fit
    >
      <GovernmentDirectoryClient directories={directories} />
    </ModulePageClient>
  );
}
