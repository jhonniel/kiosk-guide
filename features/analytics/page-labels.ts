import { db } from "@/lib/db";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/building-directory": "Building Directory",
  "/citizens-charter": "Citizens' Charter",
  "/contact": "Contact",
  "/download-center": "Download Center",
  "/emergency": "Emergency Contacts",
  "/events": "Events",
  "/faq": "FAQs",
  "/feedback": "Feedback",
  "/government-directory": "Government Directory",
  "/map": "Map of Camiguin",
  "/news": "News & Announcements",
  "/office-hours": "Office Hours",
  "/tourism": "Tourism",
};

export function isCharterVisitKey(page: string) {
  return page.startsWith("charter:");
}

function titleFromPath(page: string) {
  const last = page.split("/").filter(Boolean).pop() ?? page;
  return last.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Resolves visit keys (`/services/<slug>`, `charter:office:<id>`, …) to names admins recognise.
 * Pages that can't be resolved fall back to a readable form of the path.
 */
export async function resolvePageLabels(pages: Iterable<string>): Promise<Map<string, string>> {
  const unique = [...new Set(pages)];
  const serviceSlugs = unique
    .filter((page) => page.startsWith("/services/"))
    .map((page) => page.slice("/services/".length));
  const officeIds = unique
    .filter((page) => page.startsWith("charter:office:"))
    .map((page) => page.slice("charter:office:".length));
  const charterServiceIds = unique
    .filter((page) => page.startsWith("charter:service:"))
    .map((page) => page.slice("charter:service:".length));

  const [services, offices, charterServices] = await Promise.all([
    serviceSlugs.length
      ? db.service.findMany({ where: { slug: { in: serviceSlugs } }, select: { slug: true, titleEn: true } })
      : [],
    officeIds.length
      ? db.charterOffice.findMany({ where: { id: { in: officeIds } }, select: { id: true, name: true } })
      : [],
    charterServiceIds.length
      ? db.charterService.findMany({ where: { id: { in: charterServiceIds } }, select: { id: true, name: true } })
      : [],
  ]);

  const serviceTitles = new Map(services.map((service) => [service.slug, service.titleEn]));
  const officeNames = new Map(offices.map((office) => [office.id, office.name]));
  const charterServiceNames = new Map(charterServices.map((service) => [service.id, service.name]));

  const labels = new Map<string, string>();
  for (const page of unique) {
    if (ROUTE_LABELS[page]) {
      labels.set(page, ROUTE_LABELS[page]);
    } else if (page.startsWith("/services/")) {
      const slug = page.slice("/services/".length);
      labels.set(page, `Service: ${serviceTitles.get(slug) ?? titleFromPath(slug)}`);
    } else if (page.startsWith("charter:office:")) {
      const name = officeNames.get(page.slice("charter:office:".length));
      labels.set(page, `Charter office: ${name ?? "Removed office"}`);
    } else if (page.startsWith("charter:service:")) {
      const name = charterServiceNames.get(page.slice("charter:service:".length));
      labels.set(page, `Charter service: ${name ?? "Removed service"}`);
    } else {
      labels.set(page, titleFromPath(page));
    }
  }
  return labels;
}
