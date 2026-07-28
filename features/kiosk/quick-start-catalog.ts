import { QUICK_START_LIMIT } from "@/features/kiosk/constants";
import {
  candidateVisitKey,
  normalizeVisitPage,
  type QuickStartCandidate,
  type QuickStartLink,
} from "@/features/kiosk/quick-start";
import { buildCharterQuickStartCandidates } from "@/features/kiosk/charter-quick-start";
import type { CharterEditionView } from "@/features/citizens-charter/types";

/** Pages that should never appear in Quick Start. */
const EXCLUDED_QUICK_START_PAGES = new Set(["/", ""]);

export function isQuickStartEligiblePage(page: string): boolean {
  if (page.startsWith("charter:")) return true;
  const normalized = normalizeVisitPage(page);
  if (!normalized || EXCLUDED_QUICK_START_PAGES.has(normalized)) return false;
  return true;
}

export function buildQuickStartCandidates(input: {
  homepageCards: Array<{
    id: string;
    slug: string;
    titleEn: string;
    titleFil: string;
    titleBis?: string | null;
    icon: string | null;
    href: string;
    sortOrder: number;
    isActive?: boolean;
  }>;
  services: Array<{
    id: string;
    slug: string;
    titleEn: string;
    titleFil: string;
    titleBis?: string | null;
    icon: string | null;
    sortOrder: number;
    isActive?: boolean;
  }>;
  charterEdition?: CharterEditionView | null;
}): QuickStartCandidate[] {
  const byKey = new Map<string, QuickStartCandidate>();

  const add = (item: QuickStartCandidate) => {
    const key = candidateVisitKey(item);
    const href = normalizeVisitPage(item.href);
    if (!key.startsWith("charter:") && !isQuickStartEligiblePage(href)) return;
    byKey.set(key, item);
  };

  for (const card of input.homepageCards) {
    if (card.isActive === false) continue;
    const href = normalizeVisitPage(card.href);
    if (!isQuickStartEligiblePage(href)) continue;
    add({
      id: `card-${card.id}`,
      slug: card.slug,
      titleEn: card.titleEn,
      titleFil: card.titleFil,
      titleBis: card.titleBis,
      icon: card.icon?.trim() || "Sparkles",
      href,
      sortOrder: card.sortOrder,
    });
  }

  for (const service of input.services) {
    if (service.isActive === false) continue;
    const href = normalizeVisitPage(`/services/${service.slug}`);
    if (byKey.has(href)) continue;
    add({
      id: `service-${service.id}`,
      slug: service.slug,
      titleEn: service.titleEn,
      titleFil: service.titleFil,
      titleBis: service.titleBis,
      icon: service.icon?.trim() || "FileText",
      href,
      sortOrder: 1000 + service.sortOrder,
    });
  }

  for (const item of buildCharterQuickStartCandidates(input.charterEdition)) {
    add(item);
  }

  return [...byKey.values()];
}

/**
 * Aggregate visit counts onto candidate hrefs.
 * Nested paths (e.g. /faq?x) count toward the module href (/faq).
 */
export function aggregateVisitsForCandidates(
  candidates: QuickStartCandidate[],
  rawVisitCounts: Record<string, number>
): Record<string, number> {
  const keys = candidates.map((item) => candidateVisitKey(item));
  const totals: Record<string, number> = Object.fromEntries(keys.map((key) => [key, 0]));

  for (const [page, count] of Object.entries(rawVisitCounts)) {
    const normalized = normalizeVisitPage(page);
    if (count <= 0) continue;
    if (!normalized.startsWith("charter:") && !isQuickStartEligiblePage(normalized)) continue;

    if (normalized in totals) {
      totals[normalized] += count;
      continue;
    }

    let best: string | null = null;
    for (const item of candidates) {
      const key = candidateVisitKey(item);
      const href = normalizeVisitPage(item.href);
      if (
        normalized === key ||
        normalized === href ||
        normalized.startsWith(`${href}/`)
      ) {
        if (!best || key.length > best.length) best = key;
      }
    }
    if (best) totals[best] += count;
  }

  return totals;
}

/** Top visited real destinations only — skips items with no visit history. */
export function rankSystemQuickStart(
  candidates: QuickStartCandidate[],
  visitCounts: Record<string, number>,
  limit: number = QUICK_START_LIMIT
): QuickStartLink[] {
  const scored = aggregateVisitsForCandidates(candidates, visitCounts);

  const visited = [...candidates]
    .filter((item) => (scored[candidateVisitKey(item)] ?? 0) > 0)
    .sort((a, b) => {
      const visitsA = scored[candidateVisitKey(a)] ?? 0;
      const visitsB = scored[candidateVisitKey(b)] ?? 0;
      if (visitsB !== visitsA) return visitsB - visitsA;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.titleEn.localeCompare(b.titleEn);
    });

  return visited.slice(0, limit).map((item) => ({
    id: item.id,
    slug: item.slug,
    titleEn: item.titleEn,
    titleFil: item.titleFil,
    titleBis: item.titleBis,
    icon: item.icon,
    href: item.href,
    sortOrder: item.sortOrder,
    visitKey: item.visitKey,
  }));
}
