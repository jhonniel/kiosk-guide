/**
 * Persist SMTP values from .env into the settings table (Admin → Settings UI).
 * Run after updating .env so the admin panel shows the same values.
 */
import "dotenv/config";
import { db } from "@/lib/db";
import { SMTP_ENV_MAP, SMTP_SETTING_KEYS } from "@/features/email/smtp-env";

async function main() {
  let updated = 0;

  for (const key of SMTP_SETTING_KEYS) {
    const value = SMTP_ENV_MAP[key]?.trim();
    if (!value) continue;

    await db.setting.upsert({
      where: { key },
      update: { value, group: "downloads" },
      create: { key, value, group: "downloads" },
    });
    updated += 1;
    const masked = key === "smtp_password" ? "********" : value;
    console.log(`  ${key} = ${masked}`);
  }

  if (updated === 0) {
    console.log("No SMTP_* values found in .env — nothing to sync.");
    process.exit(1);
  }

  console.log(`Synced ${updated} SMTP setting(s) to the database.`);
}

main()
  .catch((error) => {
    console.error("SMTP sync failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
