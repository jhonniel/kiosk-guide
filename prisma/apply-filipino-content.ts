import type { PrismaClient } from "@prisma/client";
import {
  FILIPINO_DIRECTORIES,
  FILIPINO_EMERGENCY,
  FILIPINO_EVENTS,
  FILIPINO_MAP_ATTRACTIONS,
  FILIPINO_MAP_CATEGORIES,
  FILIPINO_MAP_FEATURES,
  FILIPINO_MAP_ROUTES,
  FILIPINO_SERVICES,
} from "./filipino-content";

export async function applyFilipinoContent(prisma: PrismaClient) {
  for (const [slug, fil] of Object.entries(FILIPINO_SERVICES)) {
    await prisma.service.updateMany({
      where: { slug },
      data: { requirementsFil: fil.requirementsFil },
    });
  }

  for (const [nameEn, fil] of Object.entries(FILIPINO_DIRECTORIES)) {
    await prisma.directory.updateMany({
      where: { nameEn },
      data: { nameFil: fil.nameFil, descriptionFil: fil.descriptionFil },
    });
  }

  for (const [nameEn, fil] of Object.entries(FILIPINO_EMERGENCY)) {
    await prisma.emergencyContact.updateMany({
      where: { nameEn },
      data: { nameFil: fil.nameFil, descriptionFil: fil.descriptionFil },
    });
  }

  for (const [titleEn, fil] of Object.entries(FILIPINO_EVENTS)) {
    await prisma.event.updateMany({
      where: { titleEn },
      data: { titleFil: fil.titleFil },
    });
  }
}

/** Run after seedMapEngine, which resets map names from the static catalog. */
export async function applyFilipinoMapContent(prisma: PrismaClient) {
  for (const [slug, fil] of Object.entries(FILIPINO_MAP_CATEGORIES)) {
    await prisma.mapCategory.updateMany({ where: { slug }, data: { nameFil: fil.nameFil } });
  }

  for (const [slug, fil] of Object.entries(FILIPINO_MAP_ATTRACTIONS)) {
    await prisma.mapAttraction.updateMany({
      where: { slug },
      data: { nameFil: fil.nameFil, entranceFeeFil: fil.entranceFeeFil },
    });
  }

  for (const [slug, fil] of Object.entries(FILIPINO_MAP_ROUTES)) {
    await prisma.mapRoute.updateMany({
      where: { slug },
      data: { nameFil: fil.nameFil, travelTimeFil: fil.travelTimeFil },
    });
  }

  for (const [slug, fil] of Object.entries(FILIPINO_MAP_FEATURES)) {
    await prisma.mapFeature.updateMany({ where: { slug }, data: { nameFil: fil.nameFil } });
  }
}
