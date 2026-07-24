import { NextResponse } from "next/server";
import { exportCitizensCharterOfflineData } from "@/features/offline/export-kiosk-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await exportCitizensCharterOfflineData();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
