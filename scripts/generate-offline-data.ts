import { writeFileSync, mkdirSync } from "fs";
import { exportKioskOfflineData } from "../features/offline/export-kiosk-data";
import { getKioskPrecacheRoutes } from "../features/offline/selectors";

async function main() {
  const data = await exportKioskOfflineData();
  mkdirSync("public", { recursive: true });
  writeFileSync("public/kiosk-offline-data.json", JSON.stringify(data, null, 0));
  writeFileSync("public/kiosk-precache-routes.json", JSON.stringify(getKioskPrecacheRoutes(data)));
  console.log(`Wrote kiosk offline bundle (${data.exportedAt})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
