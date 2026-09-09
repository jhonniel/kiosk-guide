import { NextResponse } from "next/server";
import { getBoolSetting, getResolvedSettings } from "@/features/settings/resolve-settings";

export const dynamic = "force-dynamic";

/** Lightweight live display flags for the public kiosk (bypasses offline cache). */
export async function GET() {
  const settings = await getResolvedSettings();
  return NextResponse.json(
    {
      autoZoomEnabled: getBoolSetting(settings, "kiosk_auto_zoom_enabled"),
      cameraTrackingEnabled: getBoolSetting(settings, "kiosk_camera_tracking_enabled"),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
