import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { activityLogAccessFor } from "@/features/analytics/access";
import { exportActivityLogs, parseActivityLogType } from "@/features/analytics/activity-log-service";
import { db } from "@/lib/db";
import { formatManilaDateTime, parseAnalyticsRangeKey, resolveAnalyticsRange } from "@/features/analytics/range";

export const dynamic = "force-dynamic";

function csvCell(value: string | null | undefined) {
  let text = value ?? "";
  // Spreadsheet apps run cells starting with these characters as formulas.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const earliest = await db.visitorLog.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } });
  const range = resolveAnalyticsRange(parseAnalyticsRangeKey(params.get("range") ?? undefined), earliest?.createdAt ?? null);
  const entries = await exportActivityLogs(
    range,
    {
      type: parseActivityLogType(params.get("type") ?? undefined),
      session: params.get("session")?.trim() || undefined,
      search: params.get("q")?.trim() || undefined,
    },
    activityLogAccessFor(session)
  );

  const lines = [
    ["Date and time (PH)", "Activity", "Item", "Details", "Visitor session", "Language"].join(","),
    ...entries.map((entry) =>
      [
        formatManilaDateTime(entry.at),
        entry.event,
        entry.subject,
        entry.detail,
        entry.sessionId,
        entry.language,
      ]
        .map(csvCell)
        .join(",")
    ),
  ];

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`\uFEFF${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kiosk-activity-${range.key}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
