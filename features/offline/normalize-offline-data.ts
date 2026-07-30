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
    serviceVisitCounts: data.pageVisitCounts ?? data.serviceVisitCounts ?? {},
    pageVisitCounts: data.pageVisitCounts ?? data.serviceVisitCounts ?? {},
    citizensCharter: data.citizensCharter ?? null,
    indoorMap: data.indoorMap ?? null,
    indoorMapV2: data.indoorMapV2 ?? false,
    uiConfigBis,
  };
}
