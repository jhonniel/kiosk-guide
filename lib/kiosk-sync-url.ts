/**
 * Remote web server that offline kiosks pull fresh data from.
 * Example: https://kiosk.camiguin.gov.ph
 *
 * When set, the local kiosk UI (e.g. http://localhost:3000) syncs content from this origin.
 * Leave unset for same-origin (browser or server hosts both UI and API).
 */
export function getKioskSyncOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_KIOSK_SYNC_URL?.trim() ?? "";
  if (!raw) return "";

  try {
    const parsed = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return parsed.origin;
  } catch {
    return "";
  }
}

export function isRemoteKioskSync(): boolean {
  return Boolean(getKioskSyncOrigin());
}

/** Resolve an app path against the sync server or same origin. */
export function resolveKioskSyncUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin = getKioskSyncOrigin();
  if (!origin) return normalized;
  return `${origin}${normalized}`;
}

/** Image/download paths from synced data — load from sync server when kiosk runs locally. */
export function resolveKioskAssetUrl(path: string | null | undefined): string {
  if (!path?.trim()) return "";
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return resolveKioskSyncUrl(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
}
