import type { BuildingDirectoryPageData } from "@/features/building-directory/page-data";
import { buildMapMarkers } from "@/features/map/build-map-markers";
import { normalizeOfflineData } from "./normalize-offline-data";
import type { KioskOfflineData } from "./types";

export function getBuildingDirectoryFromOffline(data: KioskOfflineData): BuildingDirectoryPageData & {
  directories: KioskOfflineData["directories"];
} {
  const normalized = normalizeOfflineData(data);
  const buildingDirectories = normalized.directories
    .filter((d) => d.type === "building" && d.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    isDemoMode: normalized.guideContext.isDemoMode,
    buildingName: normalized.guideContext.buildingName,
    showOfficialDirectory: !normalized.guideContext.isDemoMode && buildingDirectories.length > 0,
    navigationGraph: normalized.navigationGraph,
    locations: normalized.guideContext.locations,
    uiConfigEn: normalized.uiConfigEn,
    uiConfigFil: normalized.uiConfigFil,
    uiConfigBis: normalized.uiConfigBis,
    indoorMap: normalized.indoorMap ?? null,
    indoorMapV2: normalized.indoorMapV2 ?? false,
    directories: buildingDirectories,
  };
}

export function getMapMarkersFromOffline(data: KioskOfflineData) {
  return buildMapMarkers(data.directories, data.tourism);
}

export function getGovernmentDirectoriesFromOffline(data: KioskOfflineData) {
  return data.directories
    .filter((d) => d.type === "government" && d.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getSortedFaqs(data: KioskOfflineData) {
  return [...data.faqs].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getSortedDownloads(data: KioskOfflineData) {
  return [...data.downloads].sort(
    (a, b) => b.downloadCount - a.downloadCount || a.sortOrder - b.sortOrder
  );
}

export function getSortedTourism(data: KioskOfflineData) {
  return [...data.tourism].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getSortedAnnouncements(data: KioskOfflineData) {
  return [...data.announcements].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getSortedEvents(data: KioskOfflineData) {
  return [...data.events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
}

export function getSortedServices(data: KioskOfflineData) {
  return [...data.services].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getSortedEmergency(data: KioskOfflineData) {
  return [...data.emergency].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCitizensCharterPage(data: KioskOfflineData) {
  return data.pages.find((p) => p.slug === "citizens-charter" && p.isActive) ?? null;
}

export function getPublishedCitizensCharter(data: KioskOfflineData) {
  return data.citizensCharter ?? null;
}

export function getServiceBySlug(data: KioskOfflineData, slug: string) {
  return data.services.find((s) => s.slug === slug && s.isActive) ?? null;
}

export function getKioskPrecacheRoutes(data: KioskOfflineData): string[] {
  const staticRoutes = [
    "/",
    "/building-directory",
    "/map",
    "/contact",
    "/office-hours",
    "/faq",
    "/emergency",
    "/government-directory",
    "/download-center",
    "/tourism",
    "/news",
    "/events",
    "/citizens-charter",
    "/feedback",
  ];
  const serviceRoutes = data.services.filter((s) => s.isActive).map((s) => `/services/${s.slug}`);
  return [...staticRoutes, ...serviceRoutes];
}
