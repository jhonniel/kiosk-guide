import { db } from "@/lib/db";
import { getGuideContext } from "@/features/building-directory/guide-service";
import { getNavigationGraphForClient } from "@/features/building-directory/navigation/navigation-service";
import { CAPITOL_GROUND_NAVIGATION_GRAPH } from "@/features/building-directory/navigation/capitol-ground-graph";
import {
  applyIndoorFloorPlansToGraph,
  loadIndoorFloorPlansFor3D,
} from "@/features/building-directory/indoor-floor-plans-3d";
import { getBuildingUiConfig, type BuildingUiConfig } from "@/features/settings/building-config";
import { getResolvedSettings, getBoolSetting } from "@/features/settings/resolve-settings";
import { loadPublishedIndoorMap } from "@/features/indoor-map/admin-data";
import type { PublishedIndoorPayload } from "@/features/indoor-map/types";
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
  indoorMap: PublishedIndoorPayload | null;
  indoorMapV2: boolean;
}

export async function getBuildingDirectoryPageData(): Promise<BuildingDirectoryPageData> {
  const [
    guideContext,
    navData,
    uiConfigEn,
    uiConfigFil,
    uiConfigBis,
    directories,
    settings,
    indoorMap,
    indoorFloorPlans,
  ] = await Promise.all([
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
    loadPublishedIndoorMap().catch(() => ({ buildings: [] })),
    loadIndoorFloorPlansFor3D().catch(() => []),
  ]);

  // Three.js 3D cutaway is the primary Building Directory experience when image plans exist.
  // Leaflet indoor map is only used when indoor_map_v2 is enabled AND no image-based 3D plans.
  const hasImagePlans = indoorFloorPlans.length > 0;
  const indoorMapV2 =
    !hasImagePlans &&
    getBoolSetting(settings, "indoor_map_v2") &&
    Boolean(indoorMap.buildings.some((b) => b.floors.length > 0));

  const baseGraph = navData.graph ?? CAPITOL_GROUND_NAVIGATION_GRAPH;
  const kioskStartId = settings.building_kiosk_location_id || baseGraph.defaultStartLocationId;
  const withIndoorPlans = applyIndoorFloorPlansToGraph(baseGraph, indoorFloorPlans, {
    leafletActive: indoorMapV2,
  });

  const navigationGraph: NavigationGraph = {
    ...withIndoorPlans,
    defaultStartLocationId: kioskStartId,
  };

  const capitolName =
    indoorFloorPlans.length > 0
      ? settings.building_name_en?.trim() || "Proposed Camiguin Capitol"
      : guideContext.buildingName;

  return {
    isDemoMode: guideContext.isDemoMode,
    buildingName: capitolName,
    showOfficialDirectory: !guideContext.isDemoMode && directories.length > 0,
    navigationGraph,
    locations: guideContext.locations,
    uiConfigEn,
    uiConfigFil,
    uiConfigBis,
    indoorMap: indoorMapV2 ? indoorMap : null,
    indoorMapV2,
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
