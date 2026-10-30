import { NextResponse } from "next/server";
import {
  getDynamicQuickStartLinks,
  getSystemVisitCounts,
} from "@/features/kiosk/get-dynamic-quick-start";
import { QUICK_START_LIMIT } from "@/features/kiosk/constants";
import { isDatabaseReachable, markDatabaseDown, readBundledKioskData } from "@/lib/database-availability";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store",
};

async function bundledQuickStartResponse() {
  const bundled = await readBundledKioskData();
  const pageVisitCounts = bundled?.pageVisitCounts ?? {};
  return NextResponse.json(
    {
      links: (bundled?.quickLinks ?? []).slice(0, QUICK_START_LIMIT),
      pageVisitCounts,
      serviceVisitCounts: pageVisitCounts,
      updatedAt: bundled?.exportedAt ?? new Date().toISOString(),
    },
    { headers }
  );
}

/** Live Quick Start ranking from whole-kiosk VisitorLog popularity. */
export async function GET() {
  if (!(await isDatabaseReachable())) {
    return bundledQuickStartResponse();
  }

  try {
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
      { headers }
    );
  } catch {
    markDatabaseDown();
    return bundledQuickStartResponse();
  }
}
