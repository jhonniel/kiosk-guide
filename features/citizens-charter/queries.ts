import { db } from "@/lib/db";
import { serializeEdition, type EditionWithTree } from "./serialize";
import type { CharterEditionView } from "./types";

const editionInclude = {
  offices: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          services: {
            orderBy: { sortOrder: "asc" as const },
            include: {
              requirements: { orderBy: { sortOrder: "asc" as const } },
              steps: { orderBy: { sortOrder: "asc" as const } },
              medicines: { orderBy: { sortOrder: "asc" as const } },
            },
          },
        },
      },
    },
  },
};

export async function getPublishedCharterEdition(): Promise<CharterEditionView | null> {
  const edition = await db.charterEdition.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: editionInclude,
  });
  if (!edition) return null;
  return serializeEdition(edition as EditionWithTree, { includeInactive: false });
}

export async function getDraftCharterEdition(): Promise<CharterEditionView | null> {
  const edition = await db.charterEdition.findFirst({
    where: { status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    include: editionInclude,
  });
  if (!edition) return null;
  return serializeEdition(edition as EditionWithTree, { includeInactive: true });
}

export async function getCharterEditionById(
  id: string,
  options: { includeInactive?: boolean } = {}
): Promise<CharterEditionView | null> {
  const edition = await db.charterEdition.findUnique({
    where: { id },
    include: editionInclude,
  });
  if (!edition) return null;
  return serializeEdition(edition as EditionWithTree, {
    includeInactive: options.includeInactive ?? true,
  });
}

export async function listCharterEditions() {
  return db.charterEdition.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      year: true,
      editionLabel: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      pdfUrl: true,
    },
  });
}
