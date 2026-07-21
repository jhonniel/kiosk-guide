import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
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
