/**
 * Rewrites the offline JSON bundles so kiosks/other devices pick up admin saves
 * without waiting for the next full `npm run offline:generate`.
 */
export async function refreshKioskOfflineFiles() {
  try {
    const { writeFileSync, mkdirSync } = await import("fs");
    const { exportCitizensCharterOfflineData, exportKioskOfflineData } = await import(
      "@/features/offline/export-kiosk-data"
    );
    const { getKioskPrecacheRoutes } = await import("@/features/offline/selectors");
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
  } catch {
    // DB change already saved; kiosks with network can still load via /api/kiosk/offline-data.
  }
}
