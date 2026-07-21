import type { PrismaClient } from "@prisma/client";
import {
  CITIZENS_CHARTER_PDF_URL,
  CITIZENS_CHARTER_SERVICE_GROUPS,
} from "./services-2026";
import {
  CITIZENS_CHARTER_MEDICINES,
  CITIZENS_CHARTER_META,
  CITIZENS_CHARTER_REQUIREMENTS,
  CITIZENS_CHARTER_STEPS,
} from "./requirements-2026";

/**
 * Idempotent import of the static 2026 Charter TypeScript data into the DB.
 * Creates a PUBLISHED edition when none exists, and a matching DRAFT clone
 * when a draft is missing. Safe to re-run: existing editions are left alone
 * unless `force` is true.
 */
export async function importCitizensCharterFromStatic(
  prisma: PrismaClient,
  options: { force?: boolean } = {}
) {
  const existingPublished = await prisma.charterEdition.findFirst({
    where: { status: "PUBLISHED" },
  });
  const existingDraft = await prisma.charterEdition.findFirst({
    where: { status: "DRAFT" },
  });

  if (existingPublished && existingDraft && !options.force) {
    return {
      skipped: true,
      publishedId: existingPublished.id,
      draftId: existingDraft.id,
    };
  }

  if (options.force) {
    await prisma.charterEdition.deleteMany({});
  }

  const published =
    existingPublished && !options.force
      ? existingPublished
      : await createEditionFromStatic(prisma, "PUBLISHED");

  const draft =
    existingDraft && !options.force
      ? existingDraft
      : await cloneEditionTree(prisma, published.id, "DRAFT");

  return {
    skipped: false,
    publishedId: published.id,
    draftId: draft.id,
  };
}

async function createEditionFromStatic(
  prisma: PrismaClient,
  status: "PUBLISHED" | "DRAFT"
) {
  return prisma.$transaction(async (tx) => {
    const edition = await tx.charterEdition.create({
      data: {
        title: "Provincial Government of Camiguin Citizens' Charter",
        year: 2026,
        editionLabel: "1st Edition",
        description: "Complete list of services from the 2026 First Edition.",
        pdfUrl: CITIZENS_CHARTER_PDF_URL,
        pdfFileName: "citizens-charter.pdf",
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    for (let officeIndex = 0; officeIndex < CITIZENS_CHARTER_SERVICE_GROUPS.length; officeIndex++) {
      const group = CITIZENS_CHARTER_SERVICE_GROUPS[officeIndex];
      const office = await tx.charterOffice.create({
        data: {
          editionId: edition.id,
          name: group.office,
          sortOrder: officeIndex,
        },
      });

      for (let categoryIndex = 0; categoryIndex < group.categories.length; categoryIndex++) {
        const categoryData = group.categories[categoryIndex];
        const category = await tx.charterCategory.create({
          data: {
            officeId: office.id,
            name: categoryData.type,
            sortOrder: categoryIndex,
          },
        });

        for (let serviceIndex = 0; serviceIndex < categoryData.services.length; serviceIndex++) {
          const serviceData = categoryData.services[serviceIndex];
          const meta = CITIZENS_CHARTER_META[serviceData.page];
          const requirements = CITIZENS_CHARTER_REQUIREMENTS[serviceData.page] ?? [];
          const steps = CITIZENS_CHARTER_STEPS[serviceData.page] ?? [];
          const medicines = CITIZENS_CHARTER_MEDICINES[serviceData.page] ?? [];

          const service = await tx.charterService.create({
            data: {
              categoryId: category.id,
              name: serviceData.name,
              pageNumber: serviceData.page,
              description: meta?.description ?? "",
              officeOrDivision: meta?.officeOrDivision ?? "",
              classification: meta?.classification ?? "",
              typeOfTransaction: meta?.typeOfTransaction ?? "",
              whoMayAvail: meta?.whoMayAvail ?? "",
              detailsJson: serviceData.details?.length
                ? JSON.stringify(serviceData.details)
                : null,
              sortOrder: serviceIndex,
            },
          });

          if (requirements.length) {
            await tx.charterRequirement.createMany({
              data: requirements.map((row, index) => ({
                serviceId: service.id,
                requirement: row.requirement,
                whereToSecure: row.whereToSecure ?? "",
                isSection: Boolean(row.isSection),
                sortOrder: index,
              })),
            });
          }

          if (steps.length) {
            await tx.charterStep.createMany({
              data: steps.map((row, index) => ({
                serviceId: service.id,
                step: row.step ?? "",
                action: row.action ?? "",
                fee: row.fee ?? "",
                time: row.time ?? "",
                person: row.person ?? "",
                sortOrder: index,
              })),
            });
          }

          if (medicines.length) {
            await tx.charterMedicine.createMany({
              data: medicines.map((row, index) => ({
                serviceId: service.id,
                name: row.name,
                preparation: row.preparation ?? "",
                brand: row.brand ?? "",
                price: row.price ?? "",
                isSection: Boolean(row.isSection),
                sortOrder: index,
              })),
            });
          }
        }
      }
    }

    return edition;
  }, { timeout: 120_000 });
}

async function cloneEditionTree(
  prisma: PrismaClient,
  sourceEditionId: string,
  status: "PUBLISHED" | "DRAFT"
) {
  const source = await prisma.charterEdition.findUniqueOrThrow({
    where: { id: sourceEditionId },
    include: {
      offices: {
        orderBy: { sortOrder: "asc" },
        include: {
          categories: {
            orderBy: { sortOrder: "asc" },
            include: {
              services: {
                orderBy: { sortOrder: "asc" },
                include: {
                  requirements: { orderBy: { sortOrder: "asc" } },
                  steps: { orderBy: { sortOrder: "asc" } },
                  medicines: { orderBy: { sortOrder: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  return prisma.$transaction(async (tx) => {
    const edition = await tx.charterEdition.create({
      data: {
        title: source.title,
        year: source.year,
        editionLabel: source.editionLabel,
        description: source.description,
        pdfUrl: source.pdfUrl,
        pdfFileName: source.pdfFileName,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });

    for (const office of source.offices) {
      const newOffice = await tx.charterOffice.create({
        data: {
          editionId: edition.id,
          name: office.name,
          isActive: office.isActive,
          sortOrder: office.sortOrder,
        },
      });

      for (const category of office.categories) {
        const newCategory = await tx.charterCategory.create({
          data: {
            officeId: newOffice.id,
            name: category.name,
            isActive: category.isActive,
            sortOrder: category.sortOrder,
          },
        });

        for (const service of category.services) {
          const newService = await tx.charterService.create({
            data: {
              categoryId: newCategory.id,
              name: service.name,
              pageNumber: service.pageNumber,
              description: service.description,
              officeOrDivision: service.officeOrDivision,
              classification: service.classification,
              typeOfTransaction: service.typeOfTransaction,
              whoMayAvail: service.whoMayAvail,
              detailsJson: service.detailsJson,
              isActive: service.isActive,
              sortOrder: service.sortOrder,
            },
          });

          if (service.requirements.length) {
            await tx.charterRequirement.createMany({
              data: service.requirements.map((row) => ({
                serviceId: newService.id,
                requirement: row.requirement,
                whereToSecure: row.whereToSecure,
                isSection: row.isSection,
                isActive: row.isActive,
                sortOrder: row.sortOrder,
              })),
            });
          }

          if (service.steps.length) {
            await tx.charterStep.createMany({
              data: service.steps.map((row) => ({
                serviceId: newService.id,
                step: row.step,
                action: row.action,
                fee: row.fee,
                time: row.time,
                person: row.person,
                isActive: row.isActive,
                sortOrder: row.sortOrder,
              })),
            });
          }

          if (service.medicines.length) {
            await tx.charterMedicine.createMany({
              data: service.medicines.map((row) => ({
                serviceId: newService.id,
                name: row.name,
                preparation: row.preparation,
                brand: row.brand,
                price: row.price,
                isSection: row.isSection,
                isActive: row.isActive,
                sortOrder: row.sortOrder,
              })),
            });
          }
        }
      }
    }

    return edition;
  }, { timeout: 120_000 });
}

export { cloneEditionTree };
