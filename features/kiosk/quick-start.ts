import { QUICK_START_LIMIT } from "@/features/kiosk/constants";

export interface QuickStartLink {
  id: string;
  slug?: string;
  titleEn: string;
  titleFil: string;
  titleBis?: string | null;
  icon: string;
  href: string;
  sortOrder?: number;
  visitKey?: string;
}

export interface QuickStartCandidate extends QuickStartLink {
  sortOrder: number;
  /** Visit-log key when different from href (e.g. charter office/service). */
  visitKey?: string;
}

/** Normalize path for visit counting (strip query/hash, trailing slash). */
export function normalizeVisitPage(page: string): string {
  if (page.startsWith("charter:")) return page;
  const bare = page.split("?")[0]?.split("#")[0] ?? page;
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "/";
}

export function candidateVisitKey(item: Pick<QuickStartCandidate, "href" | "visitKey">): string {
  return item.visitKey ?? normalizeVisitPage(item.href);
}

export function serviceHref(slug: string): string {
  return `/services/${slug}`;
}

export function isServiceVisitPage(page: string): boolean {
  return normalizeVisitPage(page).startsWith("/services/");
}

/**
 * Rank transaction candidates by visit count (desc), then sortOrder, then title.
 * Used for sidebar Quick Start (top N most visited).
 */
export function rankQuickStartLinks(
  candidates: QuickStartCandidate[],
  visitCounts: Record<string, number>,
  limit: number = QUICK_START_LIMIT
): QuickStartLink[] {
  return [...candidates]
    .sort((a, b) => {
      const visitsA = visitCounts[normalizeVisitPage(a.href)] ?? 0;
      const visitsB = visitCounts[normalizeVisitPage(b.href)] ?? 0;
      if (visitsB !== visitsA) return visitsB - visitsA;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.titleEn.localeCompare(b.titleEn);
    })
    .slice(0, limit)
    .map(({ id, slug, titleEn, titleFil, titleBis, icon, href, sortOrder }) => ({
      id,
      slug,
      titleEn,
      titleFil,
      titleBis,
      icon,
      href,
      sortOrder,
    }));
}

/**
 * Prefer curated quick-link order when there are no visits yet;
 * otherwise rank by visits. Always returns at most `limit` items.
 */
export function resolveQuickStartLinks(options: {
  candidates: QuickStartCandidate[];
  fallbackLinks: QuickStartLink[];
  visitCounts: Record<string, number>;
  limit?: number;
}): QuickStartLink[] {
  const limit = options.limit ?? QUICK_START_LIMIT;
  const { candidates, fallbackLinks, visitCounts } = options;

  if (!candidates.length) {
    return fallbackLinks.slice(0, limit);
  }

  const totalVisits = Object.entries(visitCounts).reduce((sum, [page, count]) => {
    if (!isServiceVisitPage(page)) return sum;
    return sum + count;
  }, 0);

  if (totalVisits === 0 && fallbackLinks.length > 0) {
    const byHref = new Map(candidates.map((item) => [normalizeVisitPage(item.href), item]));
    const ordered: QuickStartCandidate[] = [];
    const used = new Set<string>();

    for (const link of fallbackLinks) {
      const href = normalizeVisitPage(link.href);
      const match = byHref.get(href);
      if (!match || used.has(match.id)) continue;
      ordered.push(match);
      used.add(match.id);
      if (ordered.length >= limit) break;
    }

    for (const item of [...candidates].sort((a, b) => a.sortOrder - b.sortOrder)) {
      if (used.has(item.id)) continue;
      ordered.push(item);
      used.add(item.id);
      if (ordered.length >= limit) break;
    }

    return ordered.slice(0, limit);
  }

  return rankQuickStartLinks(candidates, visitCounts, limit);
}
