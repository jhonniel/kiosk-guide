import type {
  CharterCategory,
  CharterEdition,
  CharterMedicine,
  CharterOffice,
  CharterRequirement,
  CharterService,
  CharterStep,
} from "@prisma/client";
import { normalizeCharterMetaFields } from "./normalize-meta";
import type { CharterEditionView, CharterServiceView } from "./types";

type ServiceWithChildren = CharterService & {
  requirements: CharterRequirement[];
  steps: CharterStep[];
  medicines: CharterMedicine[];
};

type CategoryWithChildren = CharterCategory & {
  services: ServiceWithChildren[];
};

type OfficeWithChildren = CharterOffice & {
  categories: CategoryWithChildren[];
};

export type EditionWithTree = CharterEdition & {
  offices: OfficeWithChildren[];
};

function parseDetails(detailsJson: string | null | undefined): string[] {
  if (!detailsJson) return [];
  try {
    const parsed = JSON.parse(detailsJson) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function serializeService(service: ServiceWithChildren, includeInactive: boolean): CharterServiceView {
  const requirements = includeInactive
    ? service.requirements
    : service.requirements.filter((row) => row.isActive);
  const steps = includeInactive ? service.steps : service.steps.filter((row) => row.isActive);
  const medicines = includeInactive
    ? service.medicines
    : service.medicines.filter((row) => row.isActive);

  const meta = normalizeCharterMetaFields({
    description: service.description,
    officeOrDivision: service.officeOrDivision,
    classification: service.classification,
    typeOfTransaction: service.typeOfTransaction,
    whoMayAvail: service.whoMayAvail,
  });

  return {
    id: service.id,
    name: service.name,
    pageNumber: service.pageNumber,
    description: meta.description,
    officeOrDivision: meta.officeOrDivision,
    classification: meta.classification,
    typeOfTransaction: meta.typeOfTransaction,
    whoMayAvail: meta.whoMayAvail,
    details: parseDetails(service.detailsJson),
    sortOrder: service.sortOrder,
    isActive: service.isActive,
    requirements: requirements
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        id: row.id,
        requirement: row.requirement,
        whereToSecure: row.whereToSecure,
        isSection: row.isSection,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      })),
    steps: steps
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        id: row.id,
        step: row.step,
        action: row.action,
        fee: row.fee,
        time: row.time,
        person: row.person,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      })),
    medicines: medicines
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((row) => ({
        id: row.id,
        name: row.name,
        preparation: row.preparation,
        brand: row.brand,
        price: row.price,
        isSection: row.isSection,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      })),
  };
}

export function serializeEdition(
  edition: EditionWithTree,
  options: { includeInactive?: boolean } = {}
): CharterEditionView {
  const includeInactive = options.includeInactive ?? false;

  const offices = edition.offices
    .filter((office) => includeInactive || office.isActive)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((office) => {
      const categories = office.categories
        .filter((category) => includeInactive || category.isActive)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((category) => {
          const services = category.services
            .filter((service) => includeInactive || service.isActive)
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((service) => serializeService(service, includeInactive));
          return {
            id: category.id,
            name: category.name,
            sortOrder: category.sortOrder,
            isActive: category.isActive,
            services,
          };
        })
        .filter((category) => includeInactive || category.services.length > 0);

      return {
        id: office.id,
        name: office.name,
        sortOrder: office.sortOrder,
        isActive: office.isActive,
        categories,
      };
    })
    .filter((office) => includeInactive || office.categories.length > 0);

  const serviceCount = offices.reduce(
    (total, office) =>
      total +
      office.categories.reduce((categoryTotal, category) => categoryTotal + category.services.length, 0),
    0
  );

  return {
    id: edition.id,
    title: edition.title,
    year: edition.year,
    editionLabel: edition.editionLabel,
    description: edition.description ?? "",
    pdfUrl: edition.pdfUrl,
    pdfFileName: edition.pdfFileName,
    status: edition.status,
    publishedAt: edition.publishedAt?.toISOString() ?? null,
    serviceCount,
    offices,
  };
}
