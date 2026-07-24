import { db } from "@/lib/db";
import type { Language } from "@/lib/i18n/translations";
import { SETTING_DEFAULTS } from "@/features/settings/defaults";
import { ALL_SETTING_KEYS } from "@/features/admin/settings-definitions";

export async function getResolvedSettings(): Promise<Record<string, string>> {
  const rows = await db.setting.findMany();
  const resolved = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    resolved[row.key] = row.value;
  }
  return resolved;
}

export function getSetting(
  settings: Record<string, string>,
  key: string,
  fallback?: string
): string {
  const value = settings[key] ?? SETTING_DEFAULTS[key] ?? fallback ?? "";
  // Prefer full-quality promo over the old lite compress.
  if (key === "promo_video_url" && /islebethere-lite\.webm$/i.test(value)) {
    return "/videos/promo/islebethere.webm";
  }
  return value;
}

export function getBoolSetting(settings: Record<string, string>, key: string): boolean {
  const value = getSetting(settings, key);
  return value === "true" || value === "1";
}

export function getNumberSetting(
  settings: Record<string, string>,
  key: string,
  fallback = 0
): number {
  const value = getSetting(settings, key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function localizedSettingKey(base: string, lang: Language): string {
  const suffix = lang === "en" ? "en" : lang === "fil" ? "fil" : "bis";
  return `${base}_${suffix}`;
}

export function getLocalizedSetting(
  settings: Record<string, string>,
  base: string,
  lang: Language
): string {
  const primary = getSetting(settings, localizedSettingKey(base, lang));
  if (primary) return primary;

  if (lang === "bis") {
    return getSetting(settings, `${base}_en`);
  }

  if (lang === "fil") {
    const en = getSetting(settings, `${base}_en`);
    if (en) return en;
    return getSetting(settings, `${base}_fil`);
  }

  const fil = getSetting(settings, `${base}_fil`);
  if (fil) return fil;
  return getSetting(settings, `${base}_en`);
}
