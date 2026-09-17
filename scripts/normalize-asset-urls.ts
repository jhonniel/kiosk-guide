/**
 * Rewrites DigitalOcean Spaces / external asset URLs in the database to local /public paths.
 * Run on production after `git pull` so images match files shipped in the repo.
 *
 * Usage: npm run assets:normalize
 */
import path from "path";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  normalizeKioskAssetPath,
  normalizeKioskSettings,
  SEED_HOMEPAGE_ICON_BY_SLUG,
} from "../lib/local-asset-url";

loadEnv({ path: path.resolve(process.cwd(), ".env") });
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();

async function normalizeSettings() {
  const rows = await prisma.setting.findMany();
  const current = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const normalized = normalizeKioskSettings(current);

  for (const [key, value] of Object.entries(normalized)) {
    const row = rows.find((item) => item.key === key);
    if (!row || row.value === value) continue;
    await prisma.setting.update({ where: { key }, data: { value } });
    console.log(`[settings] ${key}: ${row.value} → ${value}`);
  }
}

async function normalizeDownloads() {
  const rows = await prisma.download.findMany({ select: { id: true, fileUrl: true, titleEn: true } });
  for (const row of rows) {
    const local = normalizeKioskAssetPath(row.fileUrl);
    if (!local || local === row.fileUrl) continue;
    await prisma.download.update({ where: { id: row.id }, data: { fileUrl: local } });
    console.log(`[download] ${row.titleEn}: ${row.fileUrl} → ${local}`);
  }
}

async function normalizeAnnouncements() {
  const rows = await prisma.announcement.findMany({
    select: { id: true, imageUrl: true, titleEn: true },
  });
  for (const row of rows) {
    if (!row.imageUrl) continue;
    const local = normalizeKioskAssetPath(row.imageUrl);
    if (!local || local === row.imageUrl) continue;
    await prisma.announcement.update({ where: { id: row.id }, data: { imageUrl: local } });
    console.log(`[announcement] ${row.titleEn}: ${row.imageUrl} → ${local}`);
  }
}

async function normalizeTourism() {
  const rows = await prisma.tourism.findMany({ select: { id: true, imageUrl: true, titleEn: true } });
  for (const row of rows) {
    if (!row.imageUrl) continue;
    const local = normalizeKioskAssetPath(row.imageUrl);
    if (!local || local === row.imageUrl) continue;
    await prisma.tourism.update({ where: { id: row.id }, data: { imageUrl: local } });
    console.log(`[tourism] ${row.titleEn}: ${row.imageUrl} → ${local}`);
  }
}

async function normalizeCharterPdf() {
  const edition = await prisma.charterEdition.findFirst({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: { id: true, pdfUrl: true, title: true },
  });
  if (!edition?.pdfUrl) return;
  const local = normalizeKioskAssetPath(edition.pdfUrl);
  if (!local || local === edition.pdfUrl) return;
  await prisma.charterEdition.update({ where: { id: edition.id }, data: { pdfUrl: local } });
  console.log(`[charter] ${edition.title}: ${edition.pdfUrl} → ${local}`);
}

async function normalizeHomepageCards() {
  const rows = await prisma.homepageCard.findMany({
    select: { id: true, slug: true, iconUrl: true, titleEn: true },
  });
  for (const row of rows) {
    const local =
      normalizeKioskAssetPath(row.iconUrl, { slug: row.slug }) ??
      SEED_HOMEPAGE_ICON_BY_SLUG[row.slug] ??
      null;
    if (!local || local === row.iconUrl) continue;
    await prisma.homepageCard.update({ where: { id: row.id }, data: { iconUrl: local } });
    console.log(`[homepage] ${row.titleEn}: ${row.iconUrl} → ${local}`);
  }
}

async function main() {
  console.log("Normalizing asset URLs to local /public paths…");
  await normalizeSettings();
  await normalizeDownloads();
  await normalizeAnnouncements();
  await normalizeTourism();
  await normalizeCharterPdf();
  await normalizeHomepageCards();
  console.log("Done. Run: npm run offline:generate");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
