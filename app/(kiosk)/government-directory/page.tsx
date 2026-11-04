"use client";

import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKiosk } from "@/hooks/use-kiosk";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getGovernmentDirectoriesFromOffline } from "@/features/offline/selectors";
import { pickLang } from "@/lib/i18n/translations";
import { GovernmentDirectoryClient } from "./government-directory-client";

export default function GovernmentDirectoryPage() {
  const { language } = useKiosk();
  const data = useKioskOfflineData();
  const directories = getGovernmentDirectoriesFromOffline(data);

  return (
    <ModulePageClient
      icon="Users"
      titleEn="Government Directory"
      titleFil="Direktoryo ng Pamahalaan"
      titleBis="Direktoryo sa Gobyerno"
      descriptionEn="Provincial offices, department heads, and contact numbers."
      descriptionFil="Mga tanggapan ng probinsya, pinuno ng departamento, at contact number."
      descriptionBis="Mga opisina sa probinsya, pangulo sa departamento, ug contact number."
      bannerMeta={pickLang(
        language,
        `${directories.length} offices`,
        `${directories.length} opisina`,
        `${directories.length} ka opisina`
      )}
      fit
    >
      <GovernmentDirectoryClient directories={directories} />
    </ModulePageClient>
  );
}
