import { NextResponse } from "next/server";
import { exportKioskOfflineData } from "@/features/offline/export-kiosk-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await exportKioskOfflineData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
