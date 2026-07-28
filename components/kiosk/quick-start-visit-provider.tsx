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
import { normalizeVisitPage } from "@/features/kiosk/quick-start";
import {
  readLocalVisitCounts,
  recordLocalVisit,
} from "@/features/kiosk/visit-tracking";

function mergeCounts(
  ...sources: Array<Record<string, number> | undefined>
): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [page, count] of Object.entries(source)) {
      const key = normalizeVisitPage(page);
      const n = Number(count);
      if (!Number.isFinite(n) || n <= 0) continue;
      merged[key] = Math.max(merged[key] ?? 0, n);
    }
  }
  return merged;
}

interface QuickStartVisitContextValue {
  visitCounts: Record<string, number>;
  recordVisit: (page: string) => void;
}

const QuickStartVisitContext = createContext<QuickStartVisitContextValue | null>(null);

export function QuickStartVisitProvider({
  children,
  initialCounts = {},
}: {
  children: ReactNode;
  initialCounts?: Record<string, number>;
}) {
  const serverCountsRef = useRef<Record<string, number>>(initialCounts);
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>(() =>
    mergeCounts(initialCounts, readLocalVisitCounts())
  );

  const recompute = useCallback(() => {
    setVisitCounts(mergeCounts(serverCountsRef.current, readLocalVisitCounts()));
  }, []);

  const recordVisit = useCallback(
    (page: string) => {
      const normalized = normalizeVisitPage(page);
      if (!normalized) return;
      recordLocalVisit(normalized);
      setVisitCounts((current) => {
        const merged = mergeCounts(serverCountsRef.current, readLocalVisitCounts());
        return {
          ...merged,
          [normalized]: Math.max(merged[normalized] ?? 0, (current[normalized] ?? 0) + 1),
        };
      });
    },
    []
  );

  const refreshFromServer = useCallback(async () => {
    try {
      const response = await fetch("/api/kiosk/quick-start", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        pageVisitCounts?: Record<string, number>;
        serviceVisitCounts?: Record<string, number>;
      };
      const server = payload.pageVisitCounts ?? payload.serviceVisitCounts;
      if (!server) return;
      serverCountsRef.current = server;
      recompute();
    } catch {
      // offline — keep merged local counts
    }
  }, [recompute]);

  useEffect(() => {
    serverCountsRef.current = mergeCounts(serverCountsRef.current, initialCounts);
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshFromServer();
    const timer = window.setInterval(() => void refreshFromServer(), 5000);
    return () => window.clearInterval(timer);
  }, [refreshFromServer]);

  const value = useMemo(
    () => ({ visitCounts, recordVisit }),
    [visitCounts, recordVisit]
  );

  return (
    <QuickStartVisitContext.Provider value={value}>
      {children}
    </QuickStartVisitContext.Provider>
  );
}

export function useQuickStartVisits() {
  const context = useContext(QuickStartVisitContext);
  if (!context) {
    throw new Error("useQuickStartVisits must be used within QuickStartVisitProvider");
  }
  return context;
}
