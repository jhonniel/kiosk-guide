import type { PrismaClient } from "@prisma/client";
import {
  BISAYA_ANNOUNCEMENTS,
  BISAYA_DIRECTORIES,
  BISAYA_DOWNLOADS,
  BISAYA_EMERGENCY,
  BISAYA_EVENTS,
  BISAYA_FAQS,
  BISAYA_HOMEPAGE_CARDS,
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
        data: { titleBis: bis.titleBis },
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

  const announcements = await prisma.announcement.findMany({ orderBy: { publishedAt: "asc" } });
  for (let i = 0; i < announcements.length && i < BISAYA_ANNOUNCEMENTS.length; i++) {
    await prisma.announcement.update({
      where: { id: announcements[i].id },
      data: BISAYA_ANNOUNCEMENTS[i],
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

  const events = await prisma.event.findMany({ orderBy: { startDate: "asc" } });
  for (let i = 0; i < events.length && i < BISAYA_EVENTS.length; i++) {
    await prisma.event.update({
      where: { id: events[i].id },
      data: BISAYA_EVENTS[i],
    });
  }

  for (const [slug, bis] of Object.entries(BISAYA_PAGES)) {
    await prisma.page.updateMany({
      where: { slug },
      data: { titleBis: bis.titleBis, contentBis: bis.contentBis },
    });
  }
}
