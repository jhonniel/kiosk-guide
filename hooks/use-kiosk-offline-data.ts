"use client";

import { useOffline } from "@/components/providers/offline-provider";
import type { KioskOfflineData } from "@/features/offline/types";

export function useKioskOfflineData(): KioskOfflineData {
  const { offlineData, isOfflineReady } = useOffline();
  if (!isOfflineReady || !offlineData) {
    throw new Error("Kiosk offline data is not ready");
  }
  return offlineData;
}
