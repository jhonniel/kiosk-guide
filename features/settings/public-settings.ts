/** Credentials that must never reach the browser, the public offline bundle or a synced kiosk. */
const PRIVATE_SETTING_KEY = /password|secret|api_?key|access_key|private_key|token|^smtp_user$/i;

/** Settings safe to ship to the public kiosk (credentials removed; they stay server-side). */
export function toPublicKioskSettings(settings: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(settings).filter(([key]) => !PRIVATE_SETTING_KEY.test(key)));
}
