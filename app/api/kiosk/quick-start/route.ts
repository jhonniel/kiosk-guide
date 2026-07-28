import { NextResponse } from "next/server";
import {
  getDynamicQuickStartLinks,
  getSystemVisitCounts,
} from "@/features/kiosk/get-dynamic-quick-start";
import { QUICK_START_LIMIT } from "@/features/kiosk/constants";

export const dynamic = "force-dynamic";

/** Live Quick Start ranking from whole-kiosk VisitorLog popularity. */
export async function GET() {
  const [links, pageVisitCounts] = await Promise.all([
    getDynamicQuickStartLinks(QUICK_START_LIMIT),
    getSystemVisitCounts(),
  ]);

  return NextResponse.json(
    {
      links,
      pageVisitCounts,
      serviceVisitCounts: pageVisitCounts,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
