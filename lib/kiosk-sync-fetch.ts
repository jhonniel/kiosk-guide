import { resolveKioskSyncUrl } from "@/lib/kiosk-sync-url";

/** Fetch kiosk data/API from the sync server when NEXT_PUBLIC_KIOSK_SYNC_URL is set. */
export function kioskSyncFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(resolveKioskSyncUrl(path), init);
}
