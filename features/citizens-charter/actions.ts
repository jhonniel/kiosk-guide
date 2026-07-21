"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { cloneEditionTree } from "./import-static";
import { getCharterEditionById, getDraftCharterEdition } from "./queries";

function revalidateCharter() {
  revalidatePath("/citizens-charter");
  revalidatePath("/admin/citizens-charter");
  revalidatePath("/api/offline/data");
}

async function requireDraftEdition(editionId?: string) {
  await requireAdmin();
  if (editionId) {
    const edition = await db.charterEdition.findUnique({ where: { id: editionId } });
    if (!edition) throw new Error("Edition not found");
    if (edition.status !== "DRAFT") throw new Error("Only draft editions can be edited");
    return edition;
  }
  const draft = await db.charterEdition.findFirst({
    where: { status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
  });
  if (!draft) throw new Error("No draft edition found. Create a draft from the published edition first.");
  return draft;
}

async function touchEdition(editionId: string) {
  await db.charterEdition.update({
    where: { id: editionId },
    data: { updatedAt: new Date() },
  });
}

const editionSchema = z.object({
  title: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  editionLabel: z.string().min(1),
  description: z.string().optional().nullable(),
  pdfUrl: z.string().min(1),
  pdfFileName: z.string().min(1),
});

export async function updateCharterEditionSettings(input: {
  editionId: string;
  title: string;
  year: number;
  editionLabel: string;
  description?: string | null;
  pdfUrl: string;
  pdfFileName: string;
}) {
  await requireDraftEdition(input.editionId);
  const data = editionSchema.parse(input);
  await db.charterEdition.update({
    where: { id: input.editionId },
    data: {
      title: data.title,
      year: data.year,
      editionLabel: data.editionLabel,
      description: data.description ?? "",
      pdfUrl: data.pdfUrl,
      pdfFileName: data.pdfFileName,
    },
  });
  revalidateCharter();
  return { ok: true };
}

export async function ensureCharterDraft() {
  await requireAdmin();
  const existing = await getDraftCharterEdition();
  if (existing) return existing;

  const published = await db.charterEdition.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  if (!published) throw new Error("No published edition to clone");

  const draft = await cloneEditionTree(db, published.id, "DRAFT");
  revalidateCharter();
  return getCharterEditionById(draft.id, { includeInactive: true });
}

export async function publishCharterDraft(editionId: string) {
  await requireAdmin();
  const draft = await db.charterEdition.findUnique({ where: { id: editionId } });
  if (!draft || draft.status !== "DRAFT") throw new Error("Draft edition not found");

  await db.$transaction(async (tx) => {
    await tx.charterEdition.updateMany({
      where: { status: "PUBLISHED" },
      data: { status: "ARCHIVED" },
    });
    await tx.charterEdition.update({
      where: { id: editionId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await tx.charterEdition.deleteMany({
      where: { status: "DRAFT", id: { not: editionId } },
    });
  });

  // Create a fresh draft clone so editing can continue without mutating live data
  await cloneEditionTree(db, editionId, "DRAFT");
  revalidateCharter();
  return { ok: true };
}

export async function upsertCharterOffice(input: {
  editionId: string;
  id?: string;
  name: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const edition = await requireDraftEdition(input.editionId);
  const name = input.name.trim();
  if (!name) throw new Error("Office name is required");

  if (input.id) {
    const existing = await db.charterOffice.findFirst({
      where: { id: input.id, editionId: edition.id },
    });
    if (!existing) throw new Error("Office not found in this draft");
    await db.charterOffice.update({
      where: { id: input.id },
      data: {
        name,
        isActive: input.isActive ?? existing.isActive,
        sortOrder: input.sortOrder ?? existing.sortOrder,
      },
    });
  } else {
    const max = await db.charterOffice.aggregate({
      where: { editionId: edition.id },
      _max: { sortOrder: true },
    });
    await db.charterOffice.create({
      data: {
        editionId: edition.id,
        name,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? (max._max.sortOrder ?? -1) + 1,
      },
    });
  }
  await touchEdition(edition.id);
  revalidateCharter();
  return { ok: true };
}

export async function deleteCharterOffice(id: string) {
  await requireAdmin();
  const office = await db.charterOffice.findUnique({
    where: { id },
    include: { edition: true },
  });
  if (!office || office.edition.status !== "DRAFT") throw new Error("Only draft offices can be deleted");
  await db.charterOffice.delete({ where: { id } });
  await touchEdition(office.editionId);
  revalidateCharter();
  return { ok: true };
}

export async function upsertCharterCategory(input: {
  officeId: string;
  id?: string;
  name: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  await requireAdmin();
  const office = await db.charterOffice.findUnique({
    where: { id: input.officeId },
    include: { edition: true },
  });
  if (!office || office.edition.status !== "DRAFT") throw new Error("Only draft categories can be edited");

  const name = input.name.trim();
  if (!name) throw new Error("Category name is required");

  if (input.id) {
    await db.charterCategory.update({
      where: { id: input.id },
      data: {
        name,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder,
      },
    });
  } else {
    const max = await db.charterCategory.aggregate({
      where: { officeId: input.officeId },
      _max: { sortOrder: true },
    });
    await db.charterCategory.create({
      data: {
        officeId: input.officeId,
        name,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? (max._max.sortOrder ?? -1) + 1,
      },
    });
  }
  await touchEdition(office.editionId);
  revalidateCharter();
  return { ok: true };
}

export async function deleteCharterCategory(id: string) {
  await requireAdmin();
  const category = await db.charterCategory.findUnique({
    where: { id },
    include: { office: { include: { edition: true } } },
  });
  if (!category || category.office.edition.status !== "DRAFT") {
    throw new Error("Only draft categories can be deleted");
  }
  await db.charterCategory.delete({ where: { id } });
  await touchEdition(category.office.editionId);
  revalidateCharter();
  return { ok: true };
}

const serviceSchema = z.object({
  name: z.string().min(1),
  pageNumber: z.coerce.number().int().nullable().optional(),
  description: z.string().optional().nullable(),
  officeOrDivision: z.string().optional().nullable(),
  classification: z.string().optional().nullable(),
  typeOfTransaction: z.string().optional().nullable(),
  whoMayAvail: z.string().optional().nullable(),
  details: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function upsertCharterService(input: {
  categoryId: string;
  id?: string;
  name: string;
  pageNumber?: number | null;
  description?: string | null;
  officeOrDivision?: string | null;
  classification?: string | null;
  typeOfTransaction?: string | null;
  whoMayAvail?: string | null;
  details?: string[];
  isActive?: boolean;
  sortOrder?: number;
}) {
  await requireAdmin();
  const category = await db.charterCategory.findUnique({
    where: { id: input.categoryId },
    include: { office: { include: { edition: true } } },
  });
  if (!category || category.office.edition.status !== "DRAFT") {
    throw new Error("Only draft services can be edited");
  }

  const data = serviceSchema.parse(input);
  const payload = {
    name: data.name.trim(),
    pageNumber: data.pageNumber ?? null,
    description: data.description ?? "",
    officeOrDivision: data.officeOrDivision ?? "",
    classification: data.classification ?? "",
    typeOfTransaction: data.typeOfTransaction ?? "",
    whoMayAvail: data.whoMayAvail ?? "",
    detailsJson: data.details?.length ? JSON.stringify(data.details) : null,
    isActive: data.isActive ?? true,
  };

  let serviceId = input.id;
  if (input.id) {
    await db.charterService.update({
      where: { id: input.id },
      data: {
        ...payload,
        ...(data.sortOrder != null ? { sortOrder: data.sortOrder } : {}),
      },
    });
  } else {
    const max = await db.charterService.aggregate({
      where: { categoryId: input.categoryId },
      _max: { sortOrder: true },
    });
    const created = await db.charterService.create({
      data: {
        categoryId: input.categoryId,
        ...payload,
        sortOrder: data.sortOrder ?? (max._max.sortOrder ?? -1) + 1,
      },
    });
    serviceId = created.id;
  }

  await touchEdition(category.office.editionId);
  revalidateCharter();
  return { ok: true, id: serviceId };
}

export async function deleteCharterService(id: string) {
  await requireAdmin();
  const service = await db.charterService.findUnique({
    where: { id },
    include: { category: { include: { office: { include: { edition: true } } } } },
  });
  if (!service || service.category.office.edition.status !== "DRAFT") {
    throw new Error("Only draft services can be deleted");
  }
  await db.charterService.delete({ where: { id } });
  await touchEdition(service.category.office.editionId);
  revalidateCharter();
  return { ok: true };
}

export async function duplicateCharterService(id: string) {
  await requireAdmin();
  const service = await db.charterService.findUnique({
    where: { id },
    include: {
      requirements: { orderBy: { sortOrder: "asc" } },
      steps: { orderBy: { sortOrder: "asc" } },
      medicines: { orderBy: { sortOrder: "asc" } },
      category: { include: { office: { include: { edition: true } } } },
    },
  });
  if (!service || service.category.office.edition.status !== "DRAFT") {
    throw new Error("Only draft services can be duplicated");
  }

  const max = await db.charterService.aggregate({
    where: { categoryId: service.categoryId },
    _max: { sortOrder: true },
  });

  const created = await db.$transaction(async (tx) => {
    const copy = await tx.charterService.create({
      data: {
        categoryId: service.categoryId,
        name: `${service.name} (Copy)`,
        pageNumber: service.pageNumber,
        description: service.description,
        officeOrDivision: service.officeOrDivision,
        classification: service.classification,
        typeOfTransaction: service.typeOfTransaction,
        whoMayAvail: service.whoMayAvail,
        detailsJson: service.detailsJson,
        isActive: service.isActive,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
      },
    });

    if (service.requirements.length) {
      await tx.charterRequirement.createMany({
        data: service.requirements.map((row) => ({
          serviceId: copy.id,
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
          serviceId: copy.id,
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
          serviceId: copy.id,
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
    return copy;
  });

  await touchEdition(service.category.office.editionId);
  revalidateCharter();
  return { ok: true, id: created.id };
}

export async function replaceCharterRequirements(
  serviceId: string,
  rows: Array<{
    requirement: string;
    whereToSecure?: string;
    isSection?: boolean;
    isActive?: boolean;
  }>
) {
  await requireAdmin();
  const service = await db.charterService.findUnique({
    where: { id: serviceId },
    include: { category: { include: { office: { include: { edition: true } } } } },
  });
  if (!service || service.category.office.edition.status !== "DRAFT") {
    throw new Error("Only draft services can be edited");
  }

  await db.$transaction(async (tx) => {
    await tx.charterRequirement.deleteMany({ where: { serviceId } });
    if (rows.length) {
      await tx.charterRequirement.createMany({
        data: rows.map((row, index) => ({
          serviceId,
          requirement: row.requirement,
          whereToSecure: row.whereToSecure ?? "",
          isSection: Boolean(row.isSection),
          isActive: row.isActive ?? true,
          sortOrder: index,
        })),
      });
    }
  });

  await touchEdition(service.category.office.editionId);
  revalidateCharter();
  return { ok: true };
}

export async function replaceCharterSteps(
  serviceId: string,
  rows: Array<{
    step?: string;
    action?: string;
    fee?: string;
    time?: string;
    person?: string;
    isActive?: boolean;
  }>
) {
  await requireAdmin();
  const service = await db.charterService.findUnique({
    where: { id: serviceId },
    include: { category: { include: { office: { include: { edition: true } } } } },
  });
  if (!service || service.category.office.edition.status !== "DRAFT") {
    throw new Error("Only draft services can be edited");
  }

  await db.$transaction(async (tx) => {
    await tx.charterStep.deleteMany({ where: { serviceId } });
    if (rows.length) {
      await tx.charterStep.createMany({
        data: rows.map((row, index) => ({
          serviceId,
          step: row.step ?? "",
          action: row.action ?? "",
          fee: row.fee ?? "",
          time: row.time ?? "",
          person: row.person ?? "",
          isActive: row.isActive ?? true,
          sortOrder: index,
        })),
      });
    }
  });

  await touchEdition(service.category.office.editionId);
  revalidateCharter();
  return { ok: true };
}

export async function replaceCharterMedicines(
  serviceId: string,
  rows: Array<{
    name: string;
    preparation?: string;
    brand?: string;
    price?: string;
    isSection?: boolean;
    isActive?: boolean;
  }>
) {
  await requireAdmin();
  const service = await db.charterService.findUnique({
    where: { id: serviceId },
    include: { category: { include: { office: { include: { edition: true } } } } },
  });
  if (!service || service.category.office.edition.status !== "DRAFT") {
    throw new Error("Only draft services can be edited");
  }

  await db.$transaction(async (tx) => {
    await tx.charterMedicine.deleteMany({ where: { serviceId } });
    if (rows.length) {
      await tx.charterMedicine.createMany({
        data: rows.map((row, index) => ({
          serviceId,
          name: row.name,
          preparation: row.preparation ?? "",
          brand: row.brand ?? "",
          price: row.price ?? "",
          isSection: Boolean(row.isSection),
          isActive: row.isActive ?? true,
          sortOrder: index,
        })),
      });
    }
  });

  await touchEdition(service.category.office.editionId);
  revalidateCharter();
  return { ok: true };
}

export async function reorderCharterOffices(editionId: string, orderedIds: string[]) {
  const edition = await requireDraftEdition(editionId);
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.charterOffice.update({ where: { id }, data: { sortOrder: index } })
    )
  );
  await touchEdition(edition.id);
  revalidateCharter();
  return { ok: true };
}

export async function reorderCharterCategories(officeId: string, orderedIds: string[]) {
  await requireAdmin();
  const office = await db.charterOffice.findUnique({
    where: { id: officeId },
    include: { edition: true },
  });
  if (!office || office.edition.status !== "DRAFT") throw new Error("Only draft categories can be reordered");
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.charterCategory.update({ where: { id }, data: { sortOrder: index } })
    )
  );
  await touchEdition(office.editionId);
  revalidateCharter();
  return { ok: true };
}

export async function reorderCharterServices(categoryId: string, orderedIds: string[]) {
  await requireAdmin();
  const category = await db.charterCategory.findUnique({
    where: { id: categoryId },
    include: { office: { include: { edition: true } } },
  });
  if (!category || category.office.edition.status !== "DRAFT") {
    throw new Error("Only draft services can be reordered");
  }
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.charterService.update({ where: { id }, data: { sortOrder: index } })
    )
  );
  await touchEdition(category.office.editionId);
  revalidateCharter();
  return { ok: true };
}
