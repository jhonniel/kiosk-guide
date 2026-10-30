import { NextResponse } from "next/server";
import { exportKioskOfflineData } from "@/features/offline/export-kiosk-data";
import { isDatabaseReachable, markDatabaseDown, readBundledKioskData } from "@/lib/database-availability";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  if (await isDatabaseReachable()) {
    try {
      const data = await exportKioskOfflineData();
      return NextResponse.json(data, { headers });
    } catch {
      markDatabaseDown();
    }
  }

  const bundled = await readBundledKioskData();
  if (!bundled) {
    return NextResponse.json({ error: "Kiosk data is unavailable." }, { status: 503, headers });
  }

  return NextResponse.json(bundled, { headers });
}
