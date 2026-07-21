import { db } from "@/lib/db";
import { getGuideContext } from "@/features/building-directory/guide-service";
import { getNavigationGraphForClient } from "@/features/building-directory/navigation/navigation-service";
import { DEMO_NAVIGATION_GRAPH } from "@/features/building-directory/navigation/demo-graph";
import {
  buildBuildingUiConfig,
  type BuildingUiConfig,
} from "@/features/settings/building-config";
import { getResolvedSettings, getSetting } from "@/features/settings/resolve-settings";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import { getPublishedCharterEdition } from "@/features/citizens-charter/queries";
import type { KioskOfflineData } from "./types";

export const KIOSK_OFFLINE_DATA_VERSION = 3;

export async function exportKioskOfflineData(): Promise<KioskOfflineData> {
  const [
    settings,
    quickLinks,
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
    citizensCharter,
    guideContext,
    navData,
  ] = await Promise.all([
    getResolvedSettings(),
    db.quickLink.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
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
    getPublishedCharterEdition(),
    getGuideContext(),
    getNavigationGraphForClient(),
  ]);

  const baseGraph = navData.graph ?? DEMO_NAVIGATION_GRAPH;
  const kioskStartId = getSetting(settings, "building_kiosk_location_id", baseGraph.defaultStartLocationId);
  const navigationGraph: NavigationGraph = {
    ...baseGraph,
    defaultStartLocationId: kioskStartId,
  };

  const uiConfigEn: BuildingUiConfig = buildBuildingUiConfig(settings, "en");
  const uiConfigFil: BuildingUiConfig = buildBuildingUiConfig(settings, "fil");
  const uiConfigBis: BuildingUiConfig = buildBuildingUiConfig(settings, "bis");

  return {
    version: KIOSK_OFFLINE_DATA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    quickLinks,
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
    citizensCharter,
    guideContext,
    navigationGraph,
    uiConfigEn,
    uiConfigFil,
    uiConfigBis,
  };
}
