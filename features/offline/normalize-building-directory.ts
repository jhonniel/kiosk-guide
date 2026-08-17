import {
  CAPITOL_BUILDING_LOCATIONS,
  CAPITOL_BUILDING_NAME_EN,
} from "@/features/building-directory/capitol-building";
import { CAPITOL_GROUND_NAVIGATION_GRAPH } from "@/features/building-directory/navigation/capitol-ground-graph";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import type { GuideContext } from "@/features/building-directory/types";
import { buildBuildingUiConfig } from "@/features/settings/building-config";
import { SETTING_DEFAULTS } from "@/features/settings/defaults";
import type { KioskOfflineData } from "./types";

const BUILDING_SETTING_KEYS = Object.keys(SETTING_DEFAULTS).filter(
  (key) => key.startsWith("building_") || key === "indoor_map_v2"
);

function capitolSettings(settings: Record<string, string>): Record<string, string> {
  const next = { ...settings };
  for (const key of BUILDING_SETTING_KEYS) {
    next[key] = SETTING_DEFAULTS[key as keyof typeof SETTING_DEFAULTS];
  }
  return next;
}

function parseCustomNavigationGraph(settings: Record<string, string>): NavigationGraph | null {
  const raw = settings.building_navigation_graph?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as NavigationGraph;
    if (parsed?.nodes?.length && parsed?.floorPlans?.length) {
      return {
        ...parsed,
        defaultStartLocationId:
          parsed.defaultStartLocationId ??
          settings.building_kiosk_location_id ??
          CAPITOL_GROUND_NAVIGATION_GRAPH.defaultStartLocationId,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/** Upgrade legacy demo offline bundles to the Provincial Capitol ground floor map. */
export function normalizeBuildingDirectoryOffline(data: KioskOfflineData): Pick<
  KioskOfflineData,
  | "settings"
  | "guideContext"
  | "navigationGraph"
  | "indoorMapV2"
  | "uiConfigEn"
  | "uiConfigFil"
  | "uiConfigBis"
> {
  const settings = capitolSettings(data.settings ?? {});
  const customGraph = parseCustomNavigationGraph(settings);
  const navigationGraph: NavigationGraph = customGraph ?? {
    ...CAPITOL_GROUND_NAVIGATION_GRAPH,
    defaultStartLocationId:
      settings.building_kiosk_location_id || CAPITOL_GROUND_NAVIGATION_GRAPH.defaultStartLocationId,
  };

  const guideContext: GuideContext = {
    isDemoMode: false,
    buildingName: settings.building_name_en || CAPITOL_BUILDING_NAME_EN,
    locations: CAPITOL_BUILDING_LOCATIONS,
    demoNotice: settings.building_demo_notice_en,
    missingLocationMessage: settings.building_missing_location_en,
  };

  const hasCapitolImage = navigationGraph.floorPlans.some((plan) => Boolean(plan.imageUrl));

  return {
    settings,
    guideContext,
    navigationGraph,
    indoorMapV2: hasCapitolImage ? false : settings.indoor_map_v2 === "true",
    uiConfigEn: buildBuildingUiConfig(settings, "en"),
    uiConfigFil: buildBuildingUiConfig(settings, "fil"),
    uiConfigBis: buildBuildingUiConfig(settings, "bis"),
  };
}
