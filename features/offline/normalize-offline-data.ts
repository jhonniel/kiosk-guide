import { buildBuildingUiConfig } from "@/features/settings/building-config";
import type { KioskOfflineData } from "./types";

export function normalizeOfflineData(data: KioskOfflineData): KioskOfflineData {
  const uiConfigBis =
    data.uiConfigBis ?? buildBuildingUiConfig(data.settings, "bis");

  return {
    ...data,
    downloads: data.downloads.map((download) => ({
      ...download,
      downloadCount: download.downloadCount ?? 0,
    })),
    citizensCharter: data.citizensCharter ?? null,
    uiConfigBis,
  };
}
