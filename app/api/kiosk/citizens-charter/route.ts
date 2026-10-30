import { NextResponse } from "next/server";
import { getBundledCharterEdition } from "@/features/citizens-charter/bundled-edition";
import { exportCitizensCharterOfflineData } from "@/features/offline/export-kiosk-data";
import { KIOSK_OFFLINE_DATA_VERSION } from "@/features/offline/types";
import { isDatabaseReachable, markDatabaseDown } from "@/lib/database-availability";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
};

async function bundledCharterResponse() {
  const citizensCharter = await getBundledCharterEdition();
  return NextResponse.json(
    {
      version: KIOSK_OFFLINE_DATA_VERSION,
      exportedAt: new Date().toISOString(),
      citizensCharter,
    },
    { headers }
  );
}

export async function GET() {
  if (!(await isDatabaseReachable())) {
    return bundledCharterResponse();
  }

  try {
    const data = await exportCitizensCharterOfflineData();
    return NextResponse.json(data, { headers });
  } catch {
    markDatabaseDown();
    return bundledCharterResponse();
  }
}
