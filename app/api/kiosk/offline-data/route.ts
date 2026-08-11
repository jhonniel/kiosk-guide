import { NextResponse } from "next/server";
import { exportKioskOfflineData } from "@/features/offline/export-kiosk-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await exportKioskOfflineData();
  return NextResponse.json(data, {
    headers: {
      // Settings (e.g. auto-zoom) must reach kiosks immediately after admin save.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
