import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scheduleDownloadHealthSweep } from "@/features/downloads/file-health";

export const dynamic = "force-dynamic";

export async function GET() {
  // Kiosks poll this list, so it is a good moment to re-check files in the background.
  scheduleDownloadHealthSweep();
  const downloads = await db.download.findMany({
    where: { isActive: true },
    orderBy: [
      { downloadCount: "desc" },
      { sortOrder: "asc" },
      { titleEn: "asc" },
    ],
  });

  return NextResponse.json(downloads, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
