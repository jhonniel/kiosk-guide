"use client";

import { useCallback, useEffect, useState } from "react";
import type { CharterEditionView } from "@/features/citizens-charter/types";
import {
  KIOSK_OFFLINE_DATA_VERSION,
  type CitizensCharterOfflineBundle,
} from "@/features/offline/types";
import {
  loadCitizensCharterOfflineData,
  saveCitizensCharterOfflineData,
} from "@/lib/offline/idb";

const REMOTE_TIMEOUT_MS = 8000;

function isValidBundle(data: unknown): data is CitizensCharterOfflineBundle {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<CitizensCharterOfflineBundle>;
  return d.version === KIOSK_OFFLINE_DATA_VERSION && "citizensCharter" in d;
}

async function fetchJson(url: string, timeoutMs?: number): Promise<unknown | null> {
  const controller = new AbortController();
  const timer =
    timeoutMs != null ? window.setTimeout(() => controller.abort(), timeoutMs) : undefined;
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    if (timer != null) window.clearTimeout(timer);
  }
}

export function useCitizensCharterEdition() {
  const [edition, setEdition] = useState<CharterEditionView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const cached = await loadCitizensCharterOfflineData<CitizensCharterOfflineBundle>();
      const hadCache = isValidBundle(cached) && Boolean(cached.citizensCharter);
      if (hadCache && cached?.citizensCharter) {
        setEdition(cached.citizensCharter);
        setIsLoading(false);
      }

      const remote = navigator.onLine
        ? await fetchJson("/api/kiosk/citizens-charter", REMOTE_TIMEOUT_MS)
        : null;
      const needBundled = !isValidBundle(remote) || !remote.citizensCharter;
      const bundled = needBundled
        ? await fetchJson(`/kiosk-citizens-charter.json?t=${Date.now()}`)
        : null;

      const chosen =
        (isValidBundle(remote) && remote) ||
        (isValidBundle(bundled) && bundled) ||
        (isValidBundle(cached) && cached) ||
        null;

      if (!chosen?.citizensCharter) {
        if (!hadCache) setError("Could not load Citizens' Charter.");
        return;
      }

      setEdition(chosen.citizensCharter);
      setError(null);
      try {
        await saveCitizensCharterOfflineData(chosen);
      } catch {
        // Ignore IndexedDB failures.
      }
    } catch {
      setError("Could not load Citizens' Charter.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { edition, isLoading, error, reload: load };
}
