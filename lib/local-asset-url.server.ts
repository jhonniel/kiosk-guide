import { existsSync } from "fs";
import path from "path";
import { SETTING_DEFAULTS } from "@/features/settings/defaults";
import {
  LOCAL_SEARCH_DIRS,
  SEED_HOMEPAGE_ICON_BY_SLUG,
} from "@/lib/local-asset-url";
import { isStorageCdnUrl } from "@/lib/public-app-url";

export { SEED_HOMEPAGE_ICON_BY_SLUG };

function stripQuery(url: string): string {
  return url.split("?")[0] ?? url;
}

function basenameFromPath(value: string): string {
  const segments = stripQuery(value).split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

function fileNameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const base = basenameFromPath(parsed.pathname);
    return base ? decodeURIComponent(base) : null;
  } catch {
    const base = basenameFromPath(url);
    return base || null;
  }
}

function publicFileExists(publicPath: string): boolean {
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

/** Server-only variant that checks /public on disk before rewriting URLs. */
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

    const fileName = basenameFromPath(pathOnly);
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
