import type { Language } from "@/lib/i18n/translations";
import { localized } from "@/lib/i18n/translations";
import type { SearchResult } from "@/features/search/search-service";
import { resolveBuildingGuideWithContext } from "@/features/building-directory/guide-service";
import { getLocationDisplay } from "@/features/building-directory/location-display";
import { getLocalizedSetting } from "@/features/settings/resolve-settings";
import type { GuideContext, GuideResponse } from "@/features/building-directory/types";
import type { CharterEditionView } from "@/features/citizens-charter/types";
import {
  SEARCH_RESULT_LIMIT,
  searchCitizensCharterEdition,
  searchKioskModules,
  textMatches,
} from "@/features/search/kiosk-catalog";
import type { KioskOfflineData } from "./types";

function searchBuildingLocationsFromContext(query: string, context: GuideContext, lang: Language) {
  const q = query.trim();
  if (!q) return [];

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/['']/g, "'")
      .replace(/[^\w\s'-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const scoreMatch = (locQuery: string, name: string, room?: string, aliases: string[] = []) => {
    const nq = normalize(locQuery);
    const nn = normalize(name);
    if (nn === nq) return 100;
    if (nn.includes(nq)) return 80;
    if (room && nq.includes(room)) return 85;
    for (const alias of aliases) {
      if (normalize(alias).includes(nq)) return 70;
    }
    return 0;
  };

  return context.locations
    .map((loc) => {
      const { name, floor } = getLocationDisplay(loc, lang);
      const score = scoreMatch(q, name, loc.room, loc.aliases);
      return { loc, name, floor, score };
    })
    .filter((m) => m.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ loc, name, floor }) => ({
      id: loc.id,
      title: loc.room ? `${name} (Room ${loc.room})` : name,
      description: floor,
      href: `/building-directory?q=${encodeURIComponent(name)}`,
      floor,
    }));
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

export function searchAllOffline(
  query: string,
  lang: Language,
  data: KioskOfflineData,
  citizensCharter?: CharterEditionView | null
): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: SearchResult[] = [];
  const {
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
    guideContext,
  } = data;

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

  results.push(...searchCitizensCharterEdition(citizensCharter ?? data.citizensCharter, q));

  for (const match of searchBuildingLocationsFromContext(q, guideContext, lang)) {
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

function localizeGuideContext(
  context: GuideContext,
  settings: Record<string, string>,
  lang: Language
): GuideContext {
  return {
    ...context,
    buildingName: getLocalizedSetting(settings, "building_name", lang) || context.buildingName,
    demoNotice: getLocalizedSetting(settings, "building_demo_notice", lang) || context.demoNotice,
    missingLocationMessage:
      getLocalizedSetting(settings, "building_missing_location", lang) ||
      context.missingLocationMessage,
  };
}

export function resolveBuildingGuideOffline(
  query: string,
  data: KioskOfflineData,
  lang: Language = "en",
  locationId?: string
): GuideResponse {
  const context = localizeGuideContext(data.guideContext, data.settings, lang);
  return resolveBuildingGuideWithContext(query, context, lang, locationId);
}
