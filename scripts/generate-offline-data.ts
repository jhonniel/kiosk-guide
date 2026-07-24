import { writeFileSync, mkdirSync } from "fs";
import {
  exportCitizensCharterOfflineData,
  exportKioskOfflineData,
} from "../features/offline/export-kiosk-data";
import { getKioskPrecacheRoutes } from "../features/offline/selectors";

async function main() {
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
    ...(charter.citizensCharter?.pdfUrl ? [charter.citizensCharter.pdfUrl] : []),
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
  console.error(err);
  process.exit(1);
});
