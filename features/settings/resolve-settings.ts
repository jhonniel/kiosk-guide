import { db } from "@/lib/db";
import { SETTING_DEFAULTS } from "@/features/settings/defaults";
import { applySmtpEnvOverrides } from "@/features/email/smtp-env";

export {
  getSetting,
  getBoolSetting,
  getNumberSetting,
  getLocalizedSetting,
} from "@/features/settings/settings-helpers";

export async function getResolvedSettings(): Promise<Record<string, string>> {
  const rows = await db.setting.findMany();
  const resolved = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    resolved[row.key] = row.value;
  }
  return applySmtpEnvOverrides(resolved);
}
