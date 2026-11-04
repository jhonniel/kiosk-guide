import type { PrismaClient } from "@prisma/client";
import {
  BISAYA_ANNOUNCEMENTS,
  BISAYA_DIRECTORIES,
  BISAYA_DOWNLOADS,
  BISAYA_EMERGENCY,
  BISAYA_EVENTS,
  BISAYA_FAQS,
  BISAYA_HOMEPAGE_CARDS,
  BISAYA_MAP_ATTRACTIONS,
  BISAYA_MAP_CATEGORIES,
  BISAYA_MAP_FEATURES,
  BISAYA_MAP_ROUTES,
  BISAYA_PAGES,
  BISAYA_QUICK_LINKS,
  BISAYA_SERVICES,
  BISAYA_SETTINGS,
  BISAYA_TOURISM,
} from "./bisaya-content";

export async function applyBisayaContent(prisma: PrismaClient) {
  for (const [key, value] of Object.entries(BISAYA_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        group: key.startsWith("building_") ? "building" : key.startsWith("office_") ? "contact" : "branding",
      },
    });
  }

  for (const [slug, bis] of Object.entries(BISAYA_QUICK_LINKS)) {
    await prisma.quickLink.updateMany({
      where: { slug },
      data: { titleBis: bis.titleBis },
    });
  }

  for (const [slug, bis] of Object.entries(BISAYA_HOMEPAGE_CARDS)) {
    await prisma.homepageCard.updateMany({
      where: { slug },
      data: { titleBis: bis.titleBis, descriptionBis: bis.descriptionBis },
    });
  }

  for (const [slug, bis] of Object.entries(BISAYA_SERVICES)) {
    await prisma.service.updateMany({
      where: { slug },
      data: {
        titleBis: bis.titleBis,
        descriptionBis: bis.descriptionBis,
        requirementsBis: bis.requirementsBis,
        documentsBis: bis.documentsBis,
      },
    });
  }

  for (const [nameEn, bis] of Object.entries(BISAYA_DIRECTORIES)) {
    await prisma.directory.updateMany({
      where: { nameEn },
      data: { nameBis: bis.nameBis, descriptionBis: bis.descriptionBis },
    });
  }

  const downloads = await prisma.download.findMany();
  for (const download of downloads) {
    const bis = BISAYA_DOWNLOADS[download.titleEn];
    if (bis) {
      await prisma.download.update({
        where: { id: download.id },
        data: { titleBis: bis.titleBis, descriptionBis: bis.descriptionBis },
      });
    }
  }

  const faqs = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });
  for (let i = 0; i < faqs.length && i < BISAYA_FAQS.length; i++) {
    await prisma.faq.update({
      where: { id: faqs[i].id },
      data: BISAYA_FAQS[i],
    });
  }

  for (const [titleEn, bis] of Object.entries(BISAYA_ANNOUNCEMENTS)) {
    await prisma.announcement.updateMany({
      where: { titleEn },
      data: { titleBis: bis.titleBis, contentBis: bis.contentBis },
    });
  }

  for (const [titleEn, bis] of Object.entries(BISAYA_TOURISM)) {
    await prisma.tourism.updateMany({
      where: { titleEn },
      data: { titleBis: bis.titleBis, descriptionBis: bis.descriptionBis },
    });
  }

  for (const [nameEn, bis] of Object.entries(BISAYA_EMERGENCY)) {
    await prisma.emergencyContact.updateMany({
      where: { nameEn },
      data: { nameBis: bis.nameBis, descriptionBis: bis.descriptionBis },
    });
  }

  for (const [titleEn, bis] of Object.entries(BISAYA_EVENTS)) {
    await prisma.event.updateMany({
      where: { titleEn },
      data: { titleBis: bis.titleBis, descriptionBis: bis.descriptionBis },
    });
  }

  for (const [slug, bis] of Object.entries(BISAYA_PAGES)) {
    await prisma.page.updateMany({
      where: { slug },
      data: { titleBis: bis.titleBis, contentBis: bis.contentBis },
    });
  }
}

/** Run after seedMapEngine, which resets map names from the static catalog. */
export async function applyBisayaMapContent(prisma: PrismaClient) {
  for (const [slug, bis] of Object.entries(BISAYA_MAP_CATEGORIES)) {
    await prisma.mapCategory.updateMany({ where: { slug }, data: { nameBis: bis.nameBis } });
  }

  for (const [slug, bis] of Object.entries(BISAYA_MAP_ATTRACTIONS)) {
    await prisma.mapAttraction.updateMany({
      where: { slug },
      data: { nameBis: bis.nameBis, entranceFeeBis: bis.entranceFeeBis },
    });
  }

  for (const [slug, bis] of Object.entries(BISAYA_MAP_ROUTES)) {
    await prisma.mapRoute.updateMany({
      where: { slug },
      data: { nameBis: bis.nameBis, travelTimeBis: bis.travelTimeBis },
    });
  }

  for (const [slug, bis] of Object.entries(BISAYA_MAP_FEATURES)) {
    await prisma.mapFeature.updateMany({ where: { slug }, data: { nameBis: bis.nameBis } });
  }
}
