import { existsSync } from "fs";
import path from "path";
import { SETTING_DEFAULTS } from "@/features/settings/defaults";
import { isStorageCdnUrl } from "@/lib/public-app-url";

/** Bundled home screen icons — used when DB/Spaces URLs are missing or broken. */
export const SEED_HOMEPAGE_ICON_BY_SLUG: Record<string, string> = {
  "citizens-charter": "/images/home-icons/icon-citizens-charter.png",
  "building-directory": "/images/home-icons/icon-building-directory.png",
  map: "/images/home-icons/icon-map.png",
  "government-directory": "/images/home-icons/icon-government-directory.png",
  news: "/images/home-icons/icon-news.png",
  "download-center": "/images/home-icons/icon-download-center.png",
  tourism: "/images/home-icons/icon-tourism.png",
  emergency: "/images/home-icons/icon-emergency.png",
  events: "/images/home-icons/icon-events.png",
  faq: "/images/home-icons/icon-faq.png",
};

const LOCAL_SEARCH_DIRS = [
  "images/home-icons",
  "images/homepage-cards",
  "images/branding",
  "images/news",
  "images/tourism",
  "images/cami",
  "images/citizens-charter",
  "downloads",
];

function stripQuery(url: string): string {
  return url.split("?")[0] ?? url;
}

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

function canCheckPublicFiles(): boolean {
  return typeof window === "undefined";
}

function publicFileExists(publicPath: string): boolean {
  if (!canCheckPublicFiles()) return true;
  const rel = stripQuery(publicPath).replace(/^\//, "");
  return existsSync(path.join(process.cwd(), "public", rel));
}

function findLocalPublicPathByFileName(fileName: string): string | null {
  for (const dir of LOCAL_SEARCH_DIRS) {
    const publicPath = `/${dir}/${fileName}`;
    if (publicFileExists(publicPath)) return publicPath;
  }
  return null;
}

/**
 * Rewrites Spaces/external/missing paths to a bundled file under /public when possible.
 * Returns null when no reliable local path exists (caller should use Lucide icon fallback).
 */
export function normalizeKioskAssetPath(
  raw: string | null | undefined,
  options?: { slug?: string }
): string | null {
  const slugFallback = options?.slug ? SEED_HOMEPAGE_ICON_BY_SLUG[options.slug] ?? null : null;

  if (!raw?.trim()) {
    return slugFallback;
  }

  const trimmed = raw.trim();

  if (trimmed.startsWith("/")) {
    const pathOnly = stripQuery(trimmed);
    if (publicFileExists(pathOnly)) return pathOnly;

    const fileName = path.basename(pathOnly);
    const byName = fileName ? findLocalPublicPathByFileName(fileName) : null;
    if (byName) return byName;

    return slugFallback;
  }

  if (isStorageCdnUrl(trimmed) || /^https?:\/\//i.test(trimmed)) {
    const fileName = fileNameFromUrl(trimmed);
    if (fileName) {
      const byName = findLocalPublicPathByFileName(fileName);
      if (byName) return byName;
    }
    return slugFallback;
  }

  return slugFallback;
}

export function normalizeKioskSettings(settings: Record<string, string>): Record<string, string> {
  const normalized = { ...settings };
  const brandingKeys = [
    "branding_logo_url",
    "branding_caring_logo_url",
    "branding_footer_image_url",
  ] as const;

  for (const key of brandingKeys) {
    const fallback = SETTING_DEFAULTS[key] ?? "";
    const resolved =
      normalizeKioskAssetPath(settings[key]) ??
      normalizeKioskAssetPath(fallback) ??
      stripQuery(fallback);

    if (resolved) normalized[key] = resolved;
  }

  return normalized;
}
