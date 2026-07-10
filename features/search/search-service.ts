import { db } from "@/lib/db";
import type { Language } from "@/lib/i18n/translations";
import { localized } from "@/lib/i18n/translations";
import { searchBuildingLocations } from "@/features/building-directory/guide-service";

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

  const [services, directories, downloads, faqs, announcements, tourism, emergency, events, pages] =
    await Promise.all([
      db.service.findMany({ where: { isActive: true } }),
      db.directory.findMany({ where: { isActive: true } }),
      db.download.findMany({ where: { isActive: true } }),
      db.faq.findMany({ where: { isActive: true } }),
      db.announcement.findMany({ where: { isPublished: true } }),
      db.tourism.findMany({ where: { isActive: true } }),
      db.emergencyContact.findMany({ where: { isActive: true } }),
      db.event.findMany({ where: { isActive: true } }),
      db.page.findMany({ where: { isActive: true } }),
    ]);

  const matches = (text: string) => text.toLowerCase().includes(q);

  for (const service of services) {
    const title = localized(service, lang, "title");
    const desc = localized(service, lang, "description");
    const reqs = localized(service, lang, "requirements");
    if (matches(title) || matches(desc) || matches(reqs) || matches(service.slug)) {
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
    if (matches(title) || matches(desc) || matches(dir.department ?? "") || matches(dir.building ?? "")) {
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
    if (matches(title) || matches(desc) || matches(download.category ?? "")) {
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
    if (matches(title) || matches(desc)) {
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
    if (matches(title) || matches(desc)) {
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
    if (matches(title) || matches(desc) || matches(item.location ?? "")) {
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
    if (matches(title) || matches(desc) || matches(contact.phoneNumber)) {
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
    if (matches(title) || matches(desc) || matches(event.location ?? "")) {
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
    if (matches(title) || matches(desc) || matches(page.slug)) {
      results.push({
        id: page.id,
        type: "page",
        title,
        description: desc.slice(0, 120),
        href: `/${page.slug}`,
      });
    }
  }

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

  return results.slice(0, 12);
}

export async function logSearch(query: string, resultsCount: number, sessionId?: string) {
  await db.searchLog.create({
    data: { query, results: resultsCount, sessionId },
  });
}
