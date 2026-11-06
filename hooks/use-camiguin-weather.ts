"use client";

import { useEffect, useState } from "react";
import type { KioskWeather } from "@/features/weather/types";
import { kioskSyncFetch } from "@/lib/kiosk-sync-fetch";

const REFRESH_MS = 15 * 60 * 1000;

/** Current Camiguin weather; keeps the last reading if a refresh fails, null until the first one arrives. */
export function useCamiguinWeather(): KioskWeather | null {
  const [weather, setWeather] = useState<KioskWeather | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await kioskSyncFetch("/api/kiosk/weather", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as KioskWeather;
        if (!cancelled && typeof data.temperature === "number") setWeather(data);
      } catch {
        // Offline: keep whatever was last shown.
      }
    };

    void load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return weather;
}
