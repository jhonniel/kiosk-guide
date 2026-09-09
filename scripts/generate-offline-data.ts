import { writeFileSync, mkdirSync, existsSync } from "fs";
import {
  exportCitizensCharterOfflineData,
  exportKioskOfflineData,
} from "../features/offline/export-kiosk-data";
import { getKioskPrecacheRoutes } from "../features/offline/selectors";

const OFFLINE_FILES = [
  "public/kiosk-offline-data.json",
  "public/kiosk-citizens-charter.json",
  "public/kiosk-precache-routes.json",
] as const;

function hasCachedOfflineBundle() {
  return OFFLINE_FILES.every((file) => existsSync(file));
}

async function main() {
  if (process.env.SKIP_OFFLINE_GENERATE === "1") {
    if (hasCachedOfflineBundle()) {
      console.log("SKIP_OFFLINE_GENERATE=1 — keeping existing offline JSON files.");
      return;
    }
    console.warn(
      "SKIP_OFFLINE_GENERATE=1 but offline JSON is missing. Continuing without regenerating."
    );
    return;
  }

  const [data, charter] = await Promise.all([
    exportKioskOfflineData(),
    exportCitizensCharterOfflineData(),
  ]);

  mkdirSync("public", { recursive: true });
  writeFileSync("public/kiosk-offline-data.json", JSON.stringify(data, null, 0));
  writeFileSync("public/kiosk-citizens-charter.json", JSON.stringify(charter, null, 0));

  const routes = [
    ...getKioskPrecacheRoutes(data),
    "/kiosk-citizens-charter.json",
    "/kiosk-offline-data.json",
  ];
  writeFileSync("public/kiosk-precache-routes.json", JSON.stringify([...new Set(routes)]));

  const coreBytes = Buffer.byteLength(JSON.stringify(data), "utf8");
  const charterBytes = Buffer.byteLength(JSON.stringify(charter), "utf8");

  console.log(`Wrote kiosk offline bundle (${data.exportedAt})`);
  console.log("Bundle counts:", {
    version: data.version,
    homepageCards: data.homepageCards.length,
    tourism: data.tourism.length,
    services: data.services.length,
    downloads: data.downloads.length,
    coreKb: Number((coreBytes / 1024).toFixed(1)),
    charterKb: Number((charterBytes / 1024).toFixed(1)),
  });
}

main().catch((err) => {
  // Build machines often have no DB yet — allow compile to continue if cache exists
  // or when SKIP_OFFLINE_GENERATE=1.
  if (hasCachedOfflineBundle() || process.env.SKIP_OFFLINE_GENERATE === "1") {
    console.warn("offline:generate failed; using existing offline JSON (if any).");
    console.warn(err instanceof Error ? err.message : err);
    process.exit(0);
  }
  console.error(err);
  console.error(
    "\nTip: compile without DB using `npm run build:server`, then after DB is up run:\n" +
      "  npm run db:deploy && npm run db:seed && npm run offline:generate && npm run start\n"
  );
  process.exit(1);
});
