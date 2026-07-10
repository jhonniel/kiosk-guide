import { existsSync, readFileSync } from "fs";

export function readKioskPrecacheEntries(): Array<{ url: string; revision: string | null }> {
  if (!existsSync("public/kiosk-precache-routes.json")) return [];
  const routes = JSON.parse(readFileSync("public/kiosk-precache-routes.json", "utf-8")) as string[];
  let revision: string | null = null;
  if (existsSync("public/kiosk-offline-data.json")) {
    const bundle = JSON.parse(readFileSync("public/kiosk-offline-data.json", "utf-8")) as {
      exportedAt?: string;
    };
    revision = bundle.exportedAt ?? null;
  }
  return routes.map((url) => ({ url, revision }));
}
