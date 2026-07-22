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
    d.version &&
      d.settings &&
      Array.isArray(d.homepageCards) &&
      Array.isArray(d.quickLinks) &&
      d.guideContext
  );
}

const REMOTE_FETCH_TIMEOUT_MS = 5000;

async function fetchJson(url: string, timeoutMs?: number): Promise<unknown | null> {
  const controller = new AbortController();
  const timer =
    timeoutMs != null
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

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

async function loadBundledOfflineData(): Promise<KioskOfflineData | null> {
  const data = await fetchJson(`/kiosk-offline-data.json?t=${Date.now()}`);
  return isValidOfflineData(data) ? data : null;
}

async function fetchRemoteOfflineData(): Promise<KioskOfflineData | null> {
  // Cap wait time so a hung DB/API cannot block the kiosk loading gate forever.
  const data = await fetchJson("/api/kiosk/offline-data", REMOTE_FETCH_TIMEOUT_MS);
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

async function resolveOfflineData(preferRemote: boolean): Promise<KioskOfflineData | null> {
  if (preferRemote) {
    // Start bundled in parallel so a slow API still has a fast fallback ready.
    const remotePromise = fetchRemoteOfflineData();
    const bundledPromise = loadBundledOfflineData();

    const remote = await remotePromise;
    if (remote) return normalizeOfflineData(remote);

    const bundled = await bundledPromise;
    if (bundled) return normalizeOfflineData(bundled);

    const cached = await loadCachedOfflineData();
    if (cached) return normalizeOfflineData(cached);
    return null;
  }

  for (const source of [loadCachedOfflineData, loadBundledOfflineData, fetchRemoteOfflineData]) {
    const data = await source();
    if (data) return normalizeOfflineData(data);
  }
  return null;
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<KioskOfflineData | null>(null);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = isOfflineReady;
  }, [isOfflineReady]);

  const applyData = useCallback(async (data: KioskOfflineData) => {
    const normalized = normalizeOfflineData(data);
    try {
      await saveKioskOfflineData(normalized);
    } catch {
      // Continue even if IndexedDB is unavailable (private mode, quota, etc.)
    }
    setOfflineData(normalized);
    setIsOfflineReady(true);
    setLoadError(null);
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadError(null);

    try {
      const data = await resolveOfflineData(navigator.onLine);
      if (data) {
        await applyData(data);
        return;
      }
      setLoadError("Could not load kiosk data. Check your connection and try again.");
    } catch {
      setLoadError("Could not load kiosk data. Check your connection and try again.");
    } finally {
      loadingRef.current = false;
    }
  }, [applyData]);

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

    void syncOfflineData();

    const timeout = window.setTimeout(() => {
      if (!readyRef.current) {
        void syncOfflineData();
      }
    }, 8000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.clearTimeout(timeout);
    };
  }, [syncOfflineData]);

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
