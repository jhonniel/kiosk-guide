import { db } from "@/lib/db";
import { QUICK_START_LIMIT } from "@/features/kiosk/constants";
import {
  normalizeVisitPage,
  type QuickStartLink,
} from "@/features/kiosk/quick-start";
import {
  buildQuickStartCandidates,
  isQuickStartEligiblePage,
  rankSystemQuickStart,
} from "@/features/kiosk/quick-start-catalog";
import { getPublishedCharterEdition } from "@/features/citizens-charter/queries";

/** All tracked page visit counts (whole kiosk system). */
export async function getSystemVisitCounts(): Promise<Record<string, number>> {
  const rows = await db.visitorLog.groupBy({
    by: ["page"],
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const row of rows) {
    const page = normalizeVisitPage(row.page);
    if (!isQuickStartEligiblePage(page) && !page.startsWith("charter:")) continue;
    counts[page] = (counts[page] ?? 0) + row._count._all;
  }
  return counts;
}

/** @deprecated Prefer getSystemVisitCounts — kept for older imports. */
export async function getServiceVisitCounts(): Promise<Record<string, number>> {
  return getSystemVisitCounts();
}

/**
 * Top Quick Start destinations across the whole kiosk
 * (Citizens' Charter, FAQ, Tourism, services, downloads, …)
 * ranked by VisitorLog popularity.
 */
export async function getDynamicQuickStartLinks(
  limit: number = QUICK_START_LIMIT
): Promise<QuickStartLink[]> {
  const [homepageCards, services, charterEdition, visitCounts] = await Promise.all([
    db.homepageCard.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getPublishedCharterEdition(),
    getSystemVisitCounts(),
  ]);

  const candidates = buildQuickStartCandidates({
    homepageCards,
    services,
    charterEdition,
  });

  return rankSystemQuickStart(candidates, visitCounts, limit);
}
