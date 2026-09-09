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
import { kioskSyncFetch } from "@/lib/kiosk-sync-fetch";
import { isRemoteKioskSync } from "@/lib/kiosk-sync-url";

const REMOTE_TIMEOUT_MS = 8000;
const BUNDLED_CHARTER_PATH = "/kiosk-citizens-charter.json";

let memoryEdition: CharterEditionView | null = null;
let warmPromise: Promise<CharterEditionView | null> | null = null;

function isValidBundle(data: unknown): data is CitizensCharterOfflineBundle {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<CitizensCharterOfflineBundle>;
  return typeof d.version === "number" && "citizensCharter" in d && Boolean(d.citizensCharter);
}

async function fetchJson(path: string, timeoutMs?: number): Promise<unknown | null> {
  const controller = new AbortController();
  const timer =
    timeoutMs != null ? window.setTimeout(() => controller.abort(), timeoutMs) : undefined;
  try {
    const res = await kioskSyncFetch(path, { signal: controller.signal });
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

async function fetchBundledCharter(): Promise<CitizensCharterOfflineBundle | null> {
  const remote = (await fetchJson(BUNDLED_CHARTER_PATH)) as CitizensCharterOfflineBundle | null;
  if (isValidBundle(remote)) return remote;

  if (isRemoteKioskSync()) {
    try {
      const res = await fetch(BUNDLED_CHARTER_PATH, { cache: "force-cache" });
      if (res.ok) {
        const local = (await res.json()) as CitizensCharterOfflineBundle | null;
        if (isValidBundle(local)) return local;
      }
    } catch {
      // Fall through to API / IndexedDB paths.
    }
  }

  return null;
}

export function warmCitizensCharterEdition() {
  if (memoryEdition) return Promise.resolve(memoryEdition);
  if (warmPromise) return warmPromise;

  warmPromise = (async () => {
    try {
      const cached = await loadCitizensCharterOfflineData<CitizensCharterOfflineBundle>();
      const fromCache = bundleEdition(cached);
      if (fromCache) return rememberEdition(fromCache);

      const bundled = await fetchBundledCharter();
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
  const bundledPromise = fetchBundledCharter();
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
    await saveCitizensCharterOfflineData({
      ...chosen,
      version: KIOSK_OFFLINE_DATA_VERSION,
    });
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

/** Loads charter data only when needed (e.g. Quick Start after idle). */
export function useCitizensCharterEditionLazy(
  enabled: boolean,
  initialEdition?: CharterEditionView | null
) {
  const seed = initialEdition ?? memoryEdition;
  if (seed && !memoryEdition) memoryEdition = seed;

  const [edition, setEdition] = useState<CharterEditionView | null>(enabled ? seed : null);
  const [isLoading, setIsLoading] = useState(enabled && !seed);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

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
  }, [enabled, seed]);

  return { edition, isLoading, error };
}
