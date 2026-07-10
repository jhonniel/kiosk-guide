import type { Language } from "@/lib/i18n/translations";
import { localized } from "@/lib/i18n/translations";
import type { SearchResult } from "@/features/search/search-service";
import { askBuildingGuide, resolveBuildingGuideWithContext } from "@/features/building-directory/guide-service";
import { getLocationDisplay } from "@/features/building-directory/location-display";
import { getLocalizedSetting } from "@/features/settings/resolve-settings";
import type { GuideContext, GuideResponse } from "@/features/building-directory/types";
import type { KioskOfflineData } from "./types";

function matches(text: string, q: string) {
  return text.toLowerCase().includes(q);
}

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
      description: `${floor}${context.isDemoMode ? " · Demo Building" : ""}`,
      href: `/building-directory?q=${encodeURIComponent(name)}`,
      floor,
    }));
}

export function searchAllOffline(
  query: string,
  lang: Language,
  data: KioskOfflineData
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
    guideContext,
  } = data;

  for (const service of services) {
    const title = localized(service, lang, "title");
    const desc = localized(service, lang, "description");
    const reqs = localized(service, lang, "requirements");
    if (matches(title, q) || matches(desc, q) || matches(reqs, q) || matches(service.slug, q)) {
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
      matches(title, q) ||
      matches(desc, q) ||
      matches(dir.department ?? "", q) ||
      matches(dir.building ?? "", q)
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
    if (matches(title, q) || matches(desc, q) || matches(download.category ?? "", q)) {
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
    if (matches(title, q) || matches(desc, q)) {
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
    if (matches(title, q) || matches(desc, q)) {
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
    if (matches(title, q) || matches(desc, q) || matches(item.location ?? "", q)) {
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
    if (matches(title, q) || matches(desc, q) || matches(contact.phoneNumber, q)) {
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
    if (matches(title, q) || matches(desc, q) || matches(event.location ?? "", q)) {
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
    if (matches(title, q) || matches(desc, q) || matches(page.slug, q)) {
      results.push({
        id: page.id,
        type: "page",
        title,
        description: desc.slice(0, 120),
        href: `/${page.slug}`,
      });
    }
  }

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

  return results.slice(0, 12);
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
