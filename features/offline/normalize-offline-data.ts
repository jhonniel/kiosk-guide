import { buildBuildingUiConfig } from "@/features/settings/building-config";
import type { KioskOfflineData } from "./types";

export function normalizeOfflineData(data: KioskOfflineData): KioskOfflineData {
  const uiConfigBis =
    data.uiConfigBis ?? buildBuildingUiConfig(data.settings, "bis");

  return {
    ...data,
    uiConfigBis,
  };
}
