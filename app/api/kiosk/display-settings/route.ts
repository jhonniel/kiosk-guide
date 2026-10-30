import { NextResponse } from "next/server";
import { getBoolSetting, getResolvedSettings } from "@/features/settings/resolve-settings";
import { isDatabaseReachable, markDatabaseDown, readBundledKioskData } from "@/lib/database-availability";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store, max-age=0",
};

function settingsResponse(settings: Record<string, string>) {
  return NextResponse.json(
    {
      autoZoomEnabled: getBoolSetting(settings, "kiosk_auto_zoom_enabled"),
      cameraTrackingEnabled: getBoolSetting(settings, "kiosk_camera_tracking_enabled"),
    },
    { headers }
  );
}

/** Lightweight live display flags for the public kiosk (bypasses offline cache). */
export async function GET() {
  if (await isDatabaseReachable()) {
    try {
      const settings = await getResolvedSettings();
      return settingsResponse(settings);
    } catch {
      markDatabaseDown();
    }
  }

  const bundled = await readBundledKioskData();
  return settingsResponse(bundled?.settings ?? {});
}
