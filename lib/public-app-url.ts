import { getSetting } from "@/features/settings/settings-helpers";

/** True when a URL points at object storage (S3 / DO Spaces), not the kiosk app. */
export function isStorageCdnUrl(url: string): boolean {
  const lower = url.trim().toLowerCase();
  if (!lower) return false;
  return (
    lower.includes("digitaloceanspaces.com") ||
    lower.includes("amazonaws.com") ||
    lower.includes("cloudfront.net")
  );
}

export function resolvePublicAppBaseUrl(options: {
  settings: Record<string, string>;
  requestOrigin?: string;
  clientOrigin?: string;
}): string {
  const { settings, requestOrigin, clientOrigin } = options;

  const candidates = [
    clientOrigin?.trim(),
    getSetting(settings, "download_public_base_url").trim(),
    process.env.AUTH_URL?.trim(),
    process.env.NEXTAUTH_URL?.trim(),
    requestOrigin?.trim(),
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const base = raw.replace(/\/$/, "");
    if (base && !isStorageCdnUrl(base)) return base;
  }

  return "";
}

export function buildPublicAppUrl(baseUrl: string, appPath: string): string {
  const path = appPath.startsWith("/") ? appPath : `/${appPath}`;
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}
