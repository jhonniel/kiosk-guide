import { buildBuildingUiConfig } from "@/features/settings/building-config";
import { SETTING_DEFAULTS } from "@/features/settings/defaults";
import { normalizeBuildingDirectoryOffline } from "./normalize-building-directory";
import { KIOSK_OFFLINE_DATA_VERSION, type KioskOfflineData } from "./types";

export function normalizeOfflineData(data: KioskOfflineData): KioskOfflineData {
  // Fill missing keys from defaults, but never overwrite explicit saved values
  // (important for booleans like kiosk_auto_zoom_enabled = "false").
  const settings = { ...SETTING_DEFAULTS, ...(data.settings ?? {}) };
  const buildingDirectory = normalizeBuildingDirectoryOffline({ ...data, settings });
  const mergedSettings = buildingDirectory.settings;
  const uiConfigBis =
    buildingDirectory.uiConfigBis ?? buildBuildingUiConfig(mergedSettings, "bis");

  return {
    ...data,
    ...buildingDirectory,
    version: KIOSK_OFFLINE_DATA_VERSION,
    settings: mergedSettings,
    downloads: data.downloads.map((download) => ({
      ...download,
      downloadCount: download.downloadCount ?? 0,
    })),
    serviceVisitCounts: data.pageVisitCounts ?? data.serviceVisitCounts ?? {},
    pageVisitCounts: data.pageVisitCounts ?? data.serviceVisitCounts ?? {},
    citizensCharter: data.citizensCharter ?? null,
    indoorMap: data.indoorMap ?? null,
    uiConfigBis,
  };
}
