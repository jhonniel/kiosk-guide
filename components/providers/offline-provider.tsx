"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { KioskOfflineData } from "@/features/offline/types";
import { normalizeOfflineData } from "@/features/offline/normalize-offline-data";
import { loadKioskOfflineData, saveKioskOfflineData } from "@/lib/offline/idb";
import { syncQueuedFeedback } from "@/lib/offline/feedback-queue";
import { kioskSyncFetch } from "@/lib/kiosk-sync-fetch";
import { isRemoteKioskSync } from "@/lib/kiosk-sync-url";

interface OfflineContextValue {
  isOnline: boolean;
  isOfflineReady: boolean;
  offlineData: KioskOfflineData | null;
  loadError: string | null;
  syncOfflineData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

function isValidOfflineData(data: unknown): data is KioskOfflineData {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<KioskOfflineData>;
  return Boolean(
    typeof d.version === "number" &&
      d.settings &&
      Array.isArray(d.homepageCards) &&
      Array.isArray(d.quickLinks) &&
      d.guideContext
  );
}

function exportedAtMs(data: KioskOfflineData) {
  const value = Date.parse(data.exportedAt);
  return Number.isFinite(value) ? value : 0;
}

const REMOTE_FETCH_TIMEOUT_MS = 8000;

async function fetchJson(
  path: string,
  options?: { timeoutMs?: number; cache?: RequestCache }
): Promise<unknown | null> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs;
  const timer =
    timeoutMs != null
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

  try {
    const res = await kioskSyncFetch(path, {
      cache: options?.cache ?? "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    if (timer != null) window.clearTimeout(timer);
  }
}

async function loadBundledOfflineData(): Promise<KioskOfflineData | null> {
  const remoteBundled = await fetchJson("/kiosk-offline-data.json", { cache: "force-cache" });
  if (isValidOfflineData(remoteBundled)) return remoteBundled;

  if (isRemoteKioskSync()) {
    try {
      const res = await fetch("/kiosk-offline-data.json", { cache: "force-cache" });
      if (res.ok) {
        const local = await res.json();
        if (isValidOfflineData(local)) return local;
      }
    } catch {
      // Use IndexedDB / remote API when local bundled file is unavailable.
    }
  }

  return null;
}

async function fetchRemoteOfflineData(): Promise<KioskOfflineData | null> {
  const data = await fetchJson("/api/kiosk/offline-data", { timeoutMs: REMOTE_FETCH_TIMEOUT_MS });
  return isValidOfflineData(data) ? data : null;
}

async function loadCachedOfflineData(): Promise<KioskOfflineData | null> {
  try {
    const cached = await loadKioskOfflineData<KioskOfflineData>();
    return isValidOfflineData(cached) ? cached : null;
  } catch {
    return null;
  }
}

function pickFreshest(candidates: Array<KioskOfflineData | null>): KioskOfflineData | null {
  return (
    candidates
      .filter((item): item is KioskOfflineData => Boolean(item))
      .sort((a, b) => exportedAtMs(b) - exportedAtMs(a))[0] ?? null
  );
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<KioskOfflineData | null>(null);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const dataRef = useRef<KioskOfflineData | null>(null);

  const applyData = useCallback(async (data: KioskOfflineData, force = false) => {
    const normalized = normalizeOfflineData(data);
    const current = dataRef.current;
    if (!force && current && exportedAtMs(normalized) < exportedAtMs(current)) {
      return;
    }
    try {
      await saveKioskOfflineData(normalized);
    } catch {
      // Continue even if IndexedDB is unavailable (private mode, quota, etc.)
    }
    dataRef.current = normalized;
    setOfflineData(normalized);
    setIsOfflineReady(true);
    setLoadError(null);
  }, []);

  const syncLocalOfflineData = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadError(null);

    try {
      const [cached, bundled] = await Promise.all([
        loadCachedOfflineData(),
        loadBundledOfflineData(),
      ]);

      if (cached) {
        await applyData(cached);
      }

      const chosen = pickFreshest([bundled, cached]);

      if (chosen) {
        await applyData(chosen, true);
      } else if (!dataRef.current) {
        setLoadError("Could not load kiosk data. Check your connection and try again.");
      }
    } catch {
      if (!dataRef.current) {
        setLoadError("Could not load kiosk data. Check your connection and try again.");
      }
    } finally {
      loadingRef.current = false;
    }
  }, [applyData]);

  const syncRemoteOfflineData = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const remote = await fetchRemoteOfflineData();
      if (!remote) return;

      const chosen = pickFreshest([remote, dataRef.current]);
      if (chosen) {
        await applyData(chosen, true);
      }
    } catch {
      // Keep showing local/bundled data when the remote refresh fails.
    }
  }, [applyData]);

  const syncOfflineData = useCallback(async () => {
    await syncLocalOfflineData();
    await syncRemoteOfflineData();
  }, [syncLocalOfflineData, syncRemoteOfflineData]);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
      void syncOfflineData();
      void syncQueuedFeedback();
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    void syncLocalOfflineData();

    const scheduleRemoteSync = () => {
      void syncRemoteOfflineData();
    };

    let cancelRemoteSync: () => void;
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(scheduleRemoteSync, { timeout: 4000 });
      cancelRemoteSync = () => window.cancelIdleCallback(idleId);
    } else {
      const remoteSyncTimer = window.setTimeout(scheduleRemoteSync, 2000);
      cancelRemoteSync = () => window.clearTimeout(remoteSyncTimer);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      cancelRemoteSync();
    };
  }, [syncLocalOfflineData, syncRemoteOfflineData, syncOfflineData]);

  const value = useMemo(
    () => ({ isOnline, isOfflineReady, offlineData, loadError, syncOfflineData }),
    [isOnline, isOfflineReady, offlineData, loadError, syncOfflineData]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return ctx;
}
