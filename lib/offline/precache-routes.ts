import { existsSync, readFileSync } from "fs";

// Changes on every build. Precached pages point at that build's JS chunks, so a code-only build
// (offline data unchanged) must still refresh them, or kiosks keep running the old app.
const BUILD_STAMP = Date.now().toString(36);

export function readKioskPrecacheEntries(): Array<{ url: string; revision: string | null }> {
  if (!existsSync("public/kiosk-precache-routes.json")) return [];
  const routes = JSON.parse(readFileSync("public/kiosk-precache-routes.json", "utf-8")) as string[];
  let exportedAt = "";
  if (existsSync("public/kiosk-offline-data.json")) {
    const bundle = JSON.parse(readFileSync("public/kiosk-offline-data.json", "utf-8")) as {
      exportedAt?: string;
    };
    exportedAt = bundle.exportedAt ?? "";
  }
  const revision = `${exportedAt}-${BUILD_STAMP}`;
  return routes.map((url) => ({ url, revision }));
}
