"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logVisitor } from "@/features/kiosk/actions";
import { useKiosk } from "@/hooks/use-kiosk";
import { isQuickStartEligiblePage } from "@/features/kiosk/quick-start-catalog";
import { normalizeVisitPage } from "@/features/kiosk/quick-start";
import { getKioskSessionId } from "@/features/kiosk/visit-tracking";
import { useQuickStartVisits } from "@/components/kiosk/quick-start-visit-provider";

let lastPageLogged: string | null = null;
let lastLoggedAt = 0;

/** Records every kiosk page view for system-wide Quick Start ranking. */
export function KioskVisitLogger() {
  const pathname = usePathname();
  const { language } = useKiosk();
  const { recordVisit } = useQuickStartVisits();

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

    void logVisitor(page, language, getKioskSessionId()).catch(() => undefined);
  }, [pathname, language, recordVisit]);

  return null;
}
