"use client";

import { useEffect, useState } from "react";
import { scheduleWhenIdle } from "@/lib/kiosk-performance";

export function useShouldLoadCharterForQuickStart(visitCounts: Record<string, number>) {
  const hasCharterVisits = Object.keys(visitCounts).some((key) => key.startsWith("charter:"));
  const [ready, setReady] = useState(hasCharterVisits);

  useEffect(() => {
    if (hasCharterVisits) {
      setReady(true);
      return;
    }

    return scheduleWhenIdle(() => setReady(true), 8000);
  }, [hasCharterVisits]);

  return ready || hasCharterVisits;
}
