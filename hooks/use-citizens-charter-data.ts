"use client";

import { useEffect, useState } from "react";
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
const BUNDLED_CHARTER_URL = "/kiosk-citizens-charter.json";

let memoryEdition: CharterEditionView | null = null;
let warmPromise: Promise<CharterEditionView | null> | null = null;

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
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    if (timer != null) window.clearTimeout(timer);
  }
}

function bundleEdition(bundle: CitizensCharterOfflineBundle | null | undefined) {
  return isValidBundle(bundle) && bundle.citizensCharter ? bundle.citizensCharter : null;
}

function rememberEdition(edition: CharterEditionView | null) {
  if (edition) memoryEdition = edition;
  return edition;
}

/** Warm charter data as soon as the kiosk boots (sidebar / home). */
export function warmCitizensCharterEdition() {
  if (memoryEdition) return Promise.resolve(memoryEdition);
  if (warmPromise) return warmPromise;

  warmPromise = (async () => {
    try {
      const cached = await loadCitizensCharterOfflineData<CitizensCharterOfflineBundle>();
      const fromCache = bundleEdition(cached);
      if (fromCache) return rememberEdition(fromCache);

      const bundled = (await fetchJson(BUNDLED_CHARTER_URL)) as CitizensCharterOfflineBundle | null;
      const fromBundled = bundleEdition(bundled);
      if (fromBundled && bundled) {
        try {
          await saveCitizensCharterOfflineData(bundled);
        } catch {
          // Ignore IndexedDB failures.
        }
        return rememberEdition(fromBundled);
      }

      return null;
    } finally {
      warmPromise = null;
    }
  })();

  return warmPromise;
}

async function syncCitizensCharterEdition() {
  const cachedPromise = loadCitizensCharterOfflineData<CitizensCharterOfflineBundle>();
  const bundledPromise = fetchJson(BUNDLED_CHARTER_URL);
  const remotePromise = navigator.onLine
    ? fetchJson("/api/kiosk/citizens-charter", REMOTE_TIMEOUT_MS)
    : Promise.resolve(null);

  const [cached, remote, bundled] = await Promise.all([cachedPromise, remotePromise, bundledPromise]);

  const chosen =
    (isValidBundle(remote) && remote) ||
    (isValidBundle(bundled) && bundled) ||
    (isValidBundle(cached) && cached) ||
    null;

  if (!chosen?.citizensCharter) {
    return { edition: memoryEdition, error: memoryEdition ? null : "Could not load Citizens' Charter." };
  }

  rememberEdition(chosen.citizensCharter);
  try {
    await saveCitizensCharterOfflineData(chosen);
  } catch {
    // Ignore IndexedDB failures.
  }

  return { edition: chosen.citizensCharter, error: null as string | null };
}

export function useCitizensCharterEdition(initialEdition?: CharterEditionView | null) {
  const seed = initialEdition ?? memoryEdition;
  if (seed && !memoryEdition) memoryEdition = seed;

  const [edition, setEdition] = useState<CharterEditionView | null>(seed);
  const [isLoading, setIsLoading] = useState(!seed);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!seed) {
        setIsLoading(true);
        setError(null);
        const warmed = await warmCitizensCharterEdition();
        if (cancelled) return;
        if (warmed) {
          setEdition(warmed);
          setIsLoading(false);
        }
      }

      const result = await syncCitizensCharterEdition();
      if (cancelled) return;

      if (result.edition) {
        setEdition(result.edition);
        setError(null);
      } else if (result.error && !memoryEdition) {
        setError(result.error);
      }
      setIsLoading(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [seed]);

  const reload = async () => {
    setIsLoading(!edition);
    setError(null);
    const result = await syncCitizensCharterEdition();
    if (result.edition) {
      setEdition(result.edition);
      setError(null);
    } else {
      setError(result.error ?? "Could not load Citizens' Charter.");
    }
    setIsLoading(false);
  };

  return { edition, isLoading, error, reload };
}
