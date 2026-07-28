import type { CharterEditionView } from "@/features/citizens-charter/types";
import type { QuickStartCandidate } from "@/features/kiosk/quick-start";

export function charterOfficeVisitKey(officeId: string) {
  return `charter:office:${officeId}`;
}

export function charterServiceVisitKey(serviceId: string) {
  return `charter:service:${serviceId}`;
}

export function charterOfficeHref(officeId: string) {
  return `/citizens-charter?office=${encodeURIComponent(officeId)}`;
}

export function charterServiceHref(officeId: string, serviceId: string) {
  return `/citizens-charter?office=${encodeURIComponent(officeId)}&service=${encodeURIComponent(serviceId)}`;
}

/** All charter offices and documented services as Quick Start candidates. */
export function buildCharterQuickStartCandidates(
  edition: CharterEditionView | null | undefined
): QuickStartCandidate[] {
  if (!edition) return [];

  const items: QuickStartCandidate[] = [];
  let order = 2000;

  for (const office of edition.offices) {
    if (!office.isActive) continue;

    items.push({
      id: `charter-office-${office.id}`,
      slug: office.id,
      titleEn: office.name,
      titleFil: office.name,
      titleBis: office.name,
      icon: "Building2",
      href: charterOfficeHref(office.id),
      visitKey: charterOfficeVisitKey(office.id),
      sortOrder: order++,
    });

    for (const category of office.categories) {
      if (!category.isActive) continue;
      for (const service of category.services) {
        if (!service.isActive) continue;
        items.push({
          id: `charter-service-${service.id}`,
          slug: service.id,
          titleEn: service.name,
          titleFil: service.name,
          titleBis: service.name,
          icon: "FileCheck",
          href: charterServiceHref(office.id, service.id),
          visitKey: charterServiceVisitKey(service.id),
          sortOrder: order++,
        });
      }
    }
  }

  return items;
}
