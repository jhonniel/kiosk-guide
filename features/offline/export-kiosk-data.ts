import { db } from "@/lib/db";
import { getGuideContext } from "@/features/building-directory/guide-service";
import { getNavigationGraphForClient } from "@/features/building-directory/navigation/navigation-service";
import { DEMO_NAVIGATION_GRAPH } from "@/features/building-directory/navigation/demo-graph";
import {
  applyIndoorFloorPlansToGraph,
  loadIndoorFloorPlansFor3D,
} from "@/features/building-directory/indoor-floor-plans-3d";
import {
  buildBuildingUiConfig,
  type BuildingUiConfig,
} from "@/features/settings/building-config";
import { getResolvedSettings, getSetting, getBoolSetting } from "@/features/settings/resolve-settings";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import { loadPublishedIndoorMap } from "@/features/indoor-map/admin-data";
import { getPublishedCharterEdition } from "@/features/citizens-charter/queries";
import {
  getDynamicQuickStartLinks,
  getSystemVisitCounts,
} from "@/features/kiosk/get-dynamic-quick-start";
import {
  KIOSK_OFFLINE_DATA_VERSION,
  type CitizensCharterOfflineBundle,
  type KioskOfflineData,
} from "./types";

export { KIOSK_OFFLINE_DATA_VERSION };
export type { CitizensCharterOfflineBundle };

function toOfflineQuickLinks(
  links: Awaited<ReturnType<typeof getDynamicQuickStartLinks>>
): KioskOfflineData["quickLinks"] {
  const now = new Date().toISOString();
  return links.map((link, index) => ({
    id: link.id,
    slug: link.slug ?? `quick-start-${index + 1}`,
    titleEn: link.titleEn,
    titleFil: link.titleFil,
    titleBis: link.titleBis ?? null,
    icon: link.icon,
    href: link.href,
    isActive: true,
    sortOrder: index + 1,
    createdAt: now as unknown as Date,
    updatedAt: now as unknown as Date,
  }));
}

/** Light core payload used for kiosk boot (excludes heavy Citizens' Charter body). */
export async function exportKioskOfflineData(): Promise<KioskOfflineData> {
  const [
    settings,
    rankedQuickStart,
    pageVisitCounts,
    homepageCards,
    services,
    directories,
    downloads,
    faqs,
    announcements,
    tourism,
    emergency,
    events,
    pages,
    guideContext,
    navData,
    indoorMapPayload,
  ] = await Promise.all([
    getResolvedSettings(),
    getDynamicQuickStartLinks(),
    getSystemVisitCounts(),
    db.homepageCard.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.service.findMany({ where: { isActive: true } }),
    db.directory.findMany({ where: { isActive: true } }),
    db.download.findMany({
      where: { isActive: true },
      orderBy: [{ downloadCount: "desc" }, { sortOrder: "asc" }],
    }),
    db.faq.findMany({ where: { isActive: true } }),
    db.announcement.findMany({ where: { isPublished: true } }),
    db.tourism.findMany({ where: { isActive: true } }),
    db.emergencyContact.findMany({ where: { isActive: true } }),
    db.event.findMany({ where: { isActive: true } }),
    db.page.findMany({ where: { isActive: true } }),
    getGuideContext(),
    getNavigationGraphForClient(),
    loadPublishedIndoorMap().catch(() => ({ buildings: [] })),
  ]);

  const quickLinks = toOfflineQuickLinks(rankedQuickStart);

  const indoorFloorPlans = await loadIndoorFloorPlansFor3D().catch(() => []);
  const hasImagePlansExport = indoorFloorPlans.length > 0;
  const indoorMap = indoorMapPayload;
  const indoorMapV2 =
    !hasImagePlansExport &&
    getBoolSetting(settings, "indoor_map_v2") &&
    Boolean(indoorMap?.buildings.some((b) => b.floors.length > 0));

  const baseGraph = navData.graph ?? DEMO_NAVIGATION_GRAPH;
  const kioskStartId = getSetting(settings, "building_kiosk_location_id", baseGraph.defaultStartLocationId);
  const withIndoorPlans = applyIndoorFloorPlansToGraph(baseGraph, indoorFloorPlans, {
    leafletActive: indoorMapV2,
  });
  const navigationGraph: NavigationGraph = {
    ...withIndoorPlans,
    defaultStartLocationId: kioskStartId,
  };

  const uiConfigEn: BuildingUiConfig = buildBuildingUiConfig(settings, "en");
  const uiConfigFil: BuildingUiConfig = buildBuildingUiConfig(settings, "fil");
  const uiConfigBis: BuildingUiConfig = buildBuildingUiConfig(settings, "bis");

  const guideContextFixed = hasImagePlansExport
    ? {
        ...guideContext,
        buildingName: getSetting(settings, "building_name_en", "Proposed Camiguin Capitol"),
      }
    : guideContext;

  return {
    version: KIOSK_OFFLINE_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    quickLinks,
    pageVisitCounts,
    serviceVisitCounts: pageVisitCounts,
    homepageCards,
    services,
    directories,
    downloads,
    faqs,
    announcements,
    tourism,
    emergency,
    events,
    pages,
    // Loaded on demand via /api/kiosk/citizens-charter — keeps boot payload small.
    citizensCharter: null,
    guideContext: guideContextFixed,
    navigationGraph,
    indoorMap: indoorMapV2 ? indoorMap : null,
    indoorMapV2,
    uiConfigEn,
    uiConfigFil,
    uiConfigBis,
  };
}

export async function exportCitizensCharterOfflineData(): Promise<CitizensCharterOfflineBundle> {
  const citizensCharter = await getPublishedCharterEdition();
  return {
    version: KIOSK_OFFLINE_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    citizensCharter,
  };
}
