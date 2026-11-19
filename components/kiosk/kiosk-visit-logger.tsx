"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logVisitor } from "@/features/kiosk/actions";
import { useKiosk } from "@/hooks/use-kiosk";
import { isQuickStartEligiblePage } from "@/features/kiosk/quick-start-catalog";
import { normalizeVisitPage } from "@/features/kiosk/quick-start";
import { getKioskSessionId } from "@/features/kiosk/visit-tracking";
import { useQuickStartVisits } from "@/components/kiosk/quick-start-visit-provider";
import { scheduleWhenIdle } from "@/lib/kiosk-performance";
import { KIOSK_IDLE_ATTRACT_EVENT, type KioskIdleAttractDetail } from "@/lib/kiosk-events";

let lastPageLogged: string | null = null;
let lastLoggedAt = 0;

/** Records every kiosk page view for system-wide Quick Start ranking. */
export function KioskVisitLogger() {
  const pathname = usePathname();
  const { language } = useKiosk();
  const { recordVisit } = useQuickStartVisits();
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    const page = normalizeVisitPage(pathname);
    if (!page) return;

    const now = Date.now();
    if (page === lastPageLogged && now - lastLoggedAt < 1500) return;
    lastPageLogged = page;
    lastLoggedAt = now;

    if (isQuickStartEligiblePage(page)) {
      recordVisit(page);
    }

    const cancelIdle = scheduleWhenIdle(() => {
      void logVisitor(page, language, getKioskSessionId()).catch(() => undefined);
    }, 2000);

    return cancelIdle;
  }, [pathname, language, recordVisit]);

  // A visitor who starts on the screen the idle video left them on never changes route,
  // so their first page is logged here under the new session.
  useEffect(() => {
    let sawIdleVideo = false;
    let timer = 0;
    const onIdle = (event: Event) => {
      const detail = (event as CustomEvent<KioskIdleAttractDetail>).detail;
      if (detail?.phase === "video") {
        sawIdleVideo = true;
        return;
      }
      if (detail?.active || !sawIdleVideo) return;
      sawIdleVideo = false;
      const resumedAt = Date.now();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (lastLoggedAt >= resumedAt) return;
        const page = normalizeVisitPage(window.location.pathname);
        if (!page) return;
        lastPageLogged = page;
        lastLoggedAt = Date.now();
        void logVisitor(page, languageRef.current, getKioskSessionId()).catch(() => undefined);
      }, 1000);
    };
    window.addEventListener(KIOSK_IDLE_ATTRACT_EVENT, onIdle);
    return () => {
      window.removeEventListener(KIOSK_IDLE_ATTRACT_EVENT, onIdle);
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
