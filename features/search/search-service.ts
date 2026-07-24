import { db } from "@/lib/db";
import type { Language } from "@/lib/i18n/translations";
import { localized } from "@/lib/i18n/translations";
import { searchBuildingLocations } from "@/features/building-directory/guide-service";
import { getPublishedCharterEdition } from "@/features/citizens-charter/queries";
import {
  SEARCH_RESULT_LIMIT,
  searchCitizensCharterEdition,
  searchKioskModules,
  textMatches,
} from "@/features/search/kiosk-catalog";

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  href: string;
  meta?: string;
}

export async function searchAll(query: string, lang: Language): Promise<SearchResult[]> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: SearchResult[] = [];

  const [
    services,
    directories,
    downloads,
    faqs,
    announcements,
    tourism,
    emergency,
    events,
    pages,
    homepageCards,
    quickLinks,
    charter,
  ] = await Promise.all([
    db.service.findMany({ where: { isActive: true } }),
    db.directory.findMany({ where: { isActive: true } }),
    db.download.findMany({ where: { isActive: true } }),
    db.faq.findMany({ where: { isActive: true } }),
    db.announcement.findMany({ where: { isPublished: true } }),
    db.tourism.findMany({ where: { isActive: true } }),
    db.emergencyContact.findMany({ where: { isActive: true } }),
    db.event.findMany({ where: { isActive: true } }),
    db.page.findMany({ where: { isActive: true } }),
    db.homepageCard.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.quickLink.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getPublishedCharterEdition(),
  ]);

  results.push(...searchKioskModules(q, lang));

  for (const card of homepageCards) {
    const title = localized(card, lang, "title");
    const desc = localized(card, lang, "description");
    if (textMatches(title, q) || textMatches(desc, q) || textMatches(card.href, q)) {
      results.push({
        id: `home-card-${card.id}`,
        type: "home-card",
        title,
        description: desc,
        href: card.href,
      });
    }
  }

  for (const link of quickLinks) {
    const title = localized(link, lang, "title");
    if (textMatches(title, q) || textMatches(link.href, q)) {
      results.push({
        id: `quick-link-${link.id}`,
        type: "quick-link",
        title,
        description: link.href,
        href: link.href,
      });
    }
  }

  for (const service of services) {
    const title = localized(service, lang, "title");
    const desc = localized(service, lang, "description");
    const reqs = localized(service, lang, "requirements");
    if (textMatches(title, q) || textMatches(desc, q) || textMatches(reqs, q) || textMatches(service.slug, q)) {
      results.push({
        id: service.id,
        type: "service",
        title,
        description: desc,
        href: `/services/${service.slug}`,
        meta: service.officeLocation ?? undefined,
      });
    }
  }

  for (const dir of directories) {
    const title = localized(dir, lang, "name");
    const desc = localized(dir, lang, "description");
    if (
      textMatches(title, q) ||
      textMatches(desc, q) ||
      textMatches(dir.department ?? "", q) ||
      textMatches(dir.building ?? "", q) ||
      textMatches(dir.headName ?? "", q) ||
      textMatches(dir.room ?? "", q)
    ) {
      results.push({
        id: dir.id,
        type: dir.type === "building" ? "building" : "directory",
        title,
        description: desc || `${dir.floor ?? ""} ${dir.room ?? ""}`.trim(),
        href: dir.type === "building" ? "/building-directory" : "/government-directory",
        meta: dir.contactNumber ?? undefined,
      });
    }
  }

  for (const download of downloads) {
    const title = localized(download, lang, "title");
    const desc = localized(download, lang, "description");
    if (textMatches(title, q) || textMatches(desc, q) || textMatches(download.category ?? "", q)) {
      results.push({
        id: download.id,
        type: "download",
        title,
        description: desc || download.fileName,
        href: "/download-center",
      });
    }
  }

  for (const faq of faqs) {
    const title = localized(faq, lang, "question");
    const desc = localized(faq, lang, "answer");
    if (textMatches(title, q) || textMatches(desc, q)) {
      results.push({
        id: faq.id,
        type: "faq",
        title,
        description: desc.slice(0, 120),
        href: "/faq",
      });
    }
  }

  for (const item of announcements) {
    const title = localized(item, lang, "title");
    const desc = localized(item, lang, "content");
    if (textMatches(title, q) || textMatches(desc, q)) {
      results.push({
        id: item.id,
        type: "announcement",
        title,
        description: desc.slice(0, 120),
        href: "/news",
      });
    }
  }

  for (const item of tourism) {
    const title = localized(item, lang, "title");
    const desc = localized(item, lang, "description");
    if (textMatches(title, q) || textMatches(desc, q) || textMatches(item.location ?? "", q)) {
      results.push({
        id: item.id,
        type: "tourism",
        title,
        description: desc,
        href: "/tourism",
        meta: item.location ?? undefined,
      });
    }
  }

  for (const contact of emergency) {
    const title = localized(contact, lang, "name");
    const desc = localized(contact, lang, "description");
    if (textMatches(title, q) || textMatches(desc, q) || textMatches(contact.phoneNumber, q)) {
      results.push({
        id: contact.id,
        type: "emergency",
        title,
        description: desc || contact.phoneNumber,
        href: "/emergency",
        meta: contact.phoneNumber,
      });
    }
  }

  for (const event of events) {
    const title = localized(event, lang, "title");
    const desc = localized(event, lang, "description");
    if (textMatches(title, q) || textMatches(desc, q) || textMatches(event.location ?? "", q)) {
      results.push({
        id: event.id,
        type: "event",
        title,
        description: desc,
        href: "/events",
        meta: event.location ?? undefined,
      });
    }
  }

  for (const page of pages) {
    const title = localized(page, lang, "title");
    const desc = localized(page, lang, "content");
    if (textMatches(title, q) || textMatches(desc, q) || textMatches(page.slug, q)) {
      results.push({
        id: page.id,
        type: "page",
        title,
        description: desc.slice(0, 120),
        href: `/${page.slug}`,
      });
    }
  }

  results.push(...searchCitizensCharterEdition(charter, q));

  const buildingMatches = await searchBuildingLocations(q, lang);
  for (const match of buildingMatches) {
    results.push({
      id: match.id,
      type: "building-guide",
      title: match.title,
      description: match.description,
      href: match.href,
      meta: match.floor,
    });
  }

  return dedupeSearchResults(results).slice(0, SEARCH_RESULT_LIMIT);
}

function dedupeSearchResults(results: SearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.type}:${result.href}:${result.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function logSearch(query: string, resultsCount: number, sessionId?: string) {
  await db.searchLog.create({
    data: { query, results: resultsCount, sessionId },
  });
}
