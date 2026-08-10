"use client";

import { Suspense } from "react";
import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { useKioskOfflineData } from "@/hooks/use-kiosk-offline-data";
import { getBuildingDirectoryFromOffline } from "@/features/offline/selectors";
import { BuildingDirectoryPageClient } from "./building-directory-page-client";

export default function BuildingDirectoryPage() {
  const data = useKioskOfflineData();
  const pageData = getBuildingDirectoryFromOffline(data);

  return (
    <ModulePageClient
      icon="Building"
      titleEn={pageData.uiConfigEn.pageTitle}
      titleFil={pageData.uiConfigFil.pageTitle}
      titleBis={pageData.uiConfigBis.pageTitle}
      descriptionEn={pageData.uiConfigEn.pageDescription}
      descriptionFil={pageData.uiConfigFil.pageDescription}
      descriptionBis={pageData.uiConfigBis.pageDescription}
      fit
      hideBanner
    >
      <Suspense fallback={null}>
        <BuildingDirectoryPageClient
          directories={pageData.directories}
          isDemoMode={pageData.isDemoMode}
          buildingName={pageData.buildingName}
          showOfficialDirectory={pageData.showOfficialDirectory}
          navigationGraph={pageData.navigationGraph}
          locations={pageData.locations}
          uiConfigEn={pageData.uiConfigEn}
          uiConfigFil={pageData.uiConfigFil}
          uiConfigBis={pageData.uiConfigBis}
          indoorMap={pageData.indoorMap}
          indoorMapV2={pageData.indoorMapV2}
        />
      </Suspense>
    </ModulePageClient>
  );
}
