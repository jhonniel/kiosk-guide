/**
 * Rewrites DigitalOcean Spaces / external asset URLs in the database to local /public paths.
 * Run on production after `git pull` so images match files shipped in the repo.
 *
 * Usage: npm run assets:normalize
 */
import { existsSync } from "fs";
import path from "path";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { SETTING_DEFAULTS } from "../features/settings/defaults";
import { isStorageCdnUrl } from "../lib/public-app-url";

loadEnv({ path: path.resolve(process.cwd(), ".env") });
loadEnv({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();

const LOCAL_PREFIXES = [
  "public/downloads",
  "public/images/news",
  "public/images/tourism",
  "public/images/branding",
  "public/images/home-icons",
  "public/images/homepage-cards",
  "public/images/citizens-charter",
  "public/images/cami",
  "public/images/indoor-plans",
];

function fileNameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const base = path.basename(parsed.pathname);
    return base ? decodeURIComponent(base) : null;
  } catch {
    const base = path.basename(url.split("?")[0] ?? "");
    return base || null;
  }
}

function resolveLocalPublicPath(url: string): string | null {
  if (!url.trim()) return null;
  if (!/^https?:\/\//i.test(url) && url.startsWith("/")) {
    const disk = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    return existsSync(disk) ? url : null;
  }
  if (!isStorageCdnUrl(url)) return null;

  const fileName = fileNameFromUrl(url);
  if (!fileName) return null;

  for (const prefix of LOCAL_PREFIXES) {
    const disk = path.join(process.cwd(), prefix, fileName);
    if (existsSync(disk)) {
      const publicPath = `/${prefix.replace(/^public\//, "")}/${fileName}`.replace(/\/+/g, "/");
      return publicPath;
    }
  }

  return null;
}

async function normalizeSettings() {
  const brandingKeys = [
    "branding_logo_url",
    "branding_caring_logo_url",
    "branding_footer_image_url",
  ] as const;

  for (const key of brandingKeys) {
    const row = await prisma.setting.findUnique({ where: { key } });
    const current = row?.value ?? "";
    const fallback = SETTING_DEFAULTS[key] ?? "";
    const local =
      resolveLocalPublicPath(current) ??
      (fallback.startsWith("/") && existsSync(path.join(process.cwd(), "public", fallback.replace(/^\//, "").split("?")[0]!))
        ? fallback.split("?")[0]!
        : null);

    if (!local || local === current) continue;

    await prisma.setting.upsert({
      where: { key },
      create: { key, value: local, group: "branding" },
      update: { value: local },
    });
    console.log(`[settings] ${key}: ${current} → ${local}`);
  }
}

async function normalizeDownloads() {
  const rows = await prisma.download.findMany({ select: { id: true, fileUrl: true, titleEn: true } });
  for (const row of rows) {
    const local = resolveLocalPublicPath(row.fileUrl);
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
    const local = resolveLocalPublicPath(row.imageUrl);
    if (!local || local === row.imageUrl) continue;
    await prisma.announcement.update({ where: { id: row.id }, data: { imageUrl: local } });
    console.log(`[announcement] ${row.titleEn}: ${row.imageUrl} → ${local}`);
  }
}

async function normalizeTourism() {
  const rows = await prisma.tourism.findMany({ select: { id: true, imageUrl: true, titleEn: true } });
  for (const row of rows) {
    if (!row.imageUrl) continue;
    const local = resolveLocalPublicPath(row.imageUrl);
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
  const local = resolveLocalPublicPath(edition.pdfUrl);
  if (!local || local === edition.pdfUrl) return;
  await prisma.charterEdition.update({ where: { id: edition.id }, data: { pdfUrl: local } });
  console.log(`[charter] ${edition.title}: ${edition.pdfUrl} → ${local}`);
}

async function normalizeHomepageCards() {
  const rows = await prisma.homepageCard.findMany({ select: { id: true, iconUrl: true, titleEn: true } });
  for (const row of rows) {
    if (!row.iconUrl) continue;
    const local = resolveLocalPublicPath(row.iconUrl);
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
