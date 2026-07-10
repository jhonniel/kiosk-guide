import { db } from "@/lib/db";
import { getGuideContext } from "@/features/building-directory/guide-service";
import { getNavigationGraphForClient } from "@/features/building-directory/navigation/navigation-service";
import { DEMO_NAVIGATION_GRAPH } from "@/features/building-directory/navigation/demo-graph";
import { getBuildingUiConfig, type BuildingUiConfig } from "@/features/settings/building-config";
import { getResolvedSettings } from "@/features/settings/resolve-settings";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import type { BuildingLocationData } from "@/features/building-directory/types";
import type { Language } from "@/lib/i18n/translations";
import { pickLang } from "@/lib/i18n/translations";

export interface BuildingDirectoryPageData {
  isDemoMode: boolean;
  buildingName: string;
  showOfficialDirectory: boolean;
  navigationGraph: NavigationGraph;
  locations: BuildingLocationData[];
  uiConfigEn: BuildingUiConfig;
  uiConfigFil: BuildingUiConfig;
  uiConfigBis: BuildingUiConfig;
}

export async function getBuildingDirectoryPageData(): Promise<BuildingDirectoryPageData> {
  const [guideContext, navData, uiConfigEn, uiConfigFil, uiConfigBis, directories, settings] =
    await Promise.all([
      getGuideContext(),
      getNavigationGraphForClient(),
      getBuildingUiConfig("en"),
      getBuildingUiConfig("fil"),
      getBuildingUiConfig("bis"),
      db.directory.findMany({
        where: { type: "building", isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      getResolvedSettings(),
    ]);

  const baseGraph = navData.graph ?? DEMO_NAVIGATION_GRAPH;
  const kioskStartId = settings.building_kiosk_location_id || baseGraph.defaultStartLocationId;
  const navigationGraph: NavigationGraph = {
    ...baseGraph,
    defaultStartLocationId: kioskStartId,
  };

  return {
    isDemoMode: guideContext.isDemoMode,
    buildingName: guideContext.buildingName,
    showOfficialDirectory: !guideContext.isDemoMode && directories.length > 0,
    navigationGraph,
    locations: guideContext.locations,
    uiConfigEn,
    uiConfigFil,
    uiConfigBis,
  };
}

export function pickBuildingUiConfig(
  uiConfigEn: BuildingUiConfig,
  uiConfigFil: BuildingUiConfig,
  uiConfigBis: BuildingUiConfig,
  lang: Language
): BuildingUiConfig {
  return pickLang(lang, uiConfigEn, uiConfigFil, uiConfigBis);
}
