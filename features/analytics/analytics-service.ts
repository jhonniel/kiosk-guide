import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isCharterVisitKey, resolvePageLabels } from "@/features/analytics/page-labels";
import {
  MANILA_OFFSET_HOURS,
  rangeBucketKeys,
  resolveAnalyticsRange,
  type AnalyticsBucket,
  type AnalyticsRange,
  type AnalyticsRangeKey,
} from "@/features/analytics/range";

/** Visits whose first and last page are further apart than this were a kiosk left open, not one person. */
const MAX_VISIT_SECONDS = 60 * 60;

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  fil: "Filipino",
  bis: "Bisaya",
};

type Totals = {
  visitors: number;
  pageViews: number;
  searches: number;
  downloads: number;
  feedback: number;
};

export type RankedItem = { key: string; label: string; count: number; detail?: string };

export type KioskAnalytics = {
  range: AnalyticsRange;
  lastActivityAt: Date | null;
  totals: Totals;
  previousTotals: Totals | null;
  visits: {
    averageSeconds: number | null;
    averagePages: number | null;
  };
  series: Array<{ key: string; visitors: number; pageViews: number }>;
  hours: number[];
  topPages: RankedItem[];
  charterLookups: RankedItem[];
  languages: RankedItem[];
  searches: { top: RankedItem[]; noResults: RankedItem[] };
  downloads: {
    qrShown: number;
    qrScanned: number;
    emailsSent: number;
    topDocuments: RankedItem[];
  };
  feedbackAverage: number | null;
  captures: number | null;
};

const MAX_VISIT_SQL = Prisma.raw(`interval '${MAX_VISIT_SECONDS} seconds'`);
const MANILA_SQL = Prisma.raw(`"createdAt" + interval '${MANILA_OFFSET_HOURS} hours'`);

function bucketSql(bucket: AnalyticsBucket) {
  const format = bucket === "hour" ? "HH24" : bucket === "day" ? "YYYY-MM-DD" : "YYYY-MM";
  return Prisma.raw(`to_char("createdAt" + interval '${MANILA_OFFSET_HOURS} hours', '${format}')`);
}

async function totalsBetween(from: Date, to: Date): Promise<Totals> {
  const createdAt = { gte: from, lt: to };
  const [visitorRows, pageViews, searches, downloads, feedback] = await Promise.all([
    db.$queryRaw<Array<{ visitors: number }>>`
      SELECT COUNT(DISTINCT "sessionId")::int AS visitors
      FROM "VisitorLog"
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to}`,
    db.visitorLog.count({ where: { createdAt, NOT: { page: { startsWith: "charter:" } } } }),
    db.searchLog.count({ where: { createdAt } }),
    db.downloadActivity.count({ where: { createdAt, type: { in: ["QR_SCANNED", "EMAIL_SENT"] } } }),
    db.feedback.count({ where: { createdAt } }),
  ]);
  return { visitors: visitorRows[0]?.visitors ?? 0, pageViews, searches, downloads, feedback };
}

export async function getKioskAnalytics(
  rangeKey: AnalyticsRangeKey,
  options: { includeCaptures: boolean }
): Promise<KioskAnalytics> {
  const [earliest, latest] = await Promise.all([
    db.visitorLog.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    db.visitorLog.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);
  const range = resolveAnalyticsRange(rangeKey, earliest?.createdAt ?? null);
  const { from, to } = range;
  const createdAt = { gte: from, lt: to };

  const [
    totals,
    previousTotals,
    visitRows,
    seriesRows,
    hourRows,
    pageRows,
    charterRows,
    languageRows,
    topSearchRows,
    noResultRows,
    activityRows,
    documentRows,
    feedbackStats,
    captures,
  ] = await Promise.all([
    totalsBetween(from, to),
    range.previous ? totalsBetween(range.previous.from, range.previous.to) : Promise.resolve(null),
    db.$queryRaw<Array<{ average_seconds: number | null; average_pages: number | null }>>`
      SELECT
        AVG(EXTRACT(EPOCH FROM (last_at - first_at)))
          FILTER (WHERE views > 1 AND last_at - first_at <= ${MAX_VISIT_SQL})::float AS average_seconds,
        AVG(views) FILTER (WHERE last_at - first_at <= ${MAX_VISIT_SQL})::float AS average_pages
      FROM (
        SELECT "sessionId", MIN("createdAt") AS first_at, MAX("createdAt") AS last_at, COUNT(*) AS views
        FROM "VisitorLog"
        WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
          AND "sessionId" IS NOT NULL AND page NOT LIKE 'charter:%'
        GROUP BY "sessionId"
      ) visits`,
    db.$queryRaw<Array<{ bucket: string; visitors: number; page_views: number }>>`
      SELECT ${bucketSql(range.bucket)} AS bucket,
        COUNT(DISTINCT "sessionId")::int AS visitors,
        (COUNT(*) FILTER (WHERE page NOT LIKE 'charter:%'))::int AS page_views
      FROM "VisitorLog"
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
      GROUP BY 1`,
    db.$queryRaw<Array<{ hour: number; views: number }>>`
      SELECT EXTRACT(HOUR FROM ${MANILA_SQL})::int AS hour,
        COUNT(*)::int AS views
      FROM "VisitorLog"
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to} AND page NOT LIKE 'charter:%'
      GROUP BY 1`,
    db.visitorLog.groupBy({
      by: ["page"],
      where: { createdAt, NOT: { page: { startsWith: "charter:" } } },
      _count: { _all: true },
      orderBy: { _count: { page: "desc" } },
      take: 10,
    }),
    db.visitorLog.groupBy({
      by: ["page"],
      where: { createdAt, page: { startsWith: "charter:" } },
      _count: { _all: true },
      orderBy: { _count: { page: "desc" } },
      take: 8,
    }),
    db.visitorLog.groupBy({
      by: ["language"],
      where: { createdAt },
      _count: { _all: true },
    }),
    db.$queryRaw<Array<{ query: string; searches: number; results: number }>>`
      SELECT lower(trim(query)) AS query, COUNT(*)::int AS searches, MAX(results)::int AS results
      FROM "SearchLog"
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to} AND trim(query) <> ''
      GROUP BY 1
      ORDER BY searches DESC, query ASC
      LIMIT 10`,
    db.$queryRaw<Array<{ query: string; searches: number }>>`
      SELECT lower(trim(query)) AS query, COUNT(*)::int AS searches
      FROM "SearchLog"
      WHERE "createdAt" >= ${from} AND "createdAt" < ${to} AND results = 0 AND trim(query) <> ''
      GROUP BY 1
      ORDER BY searches DESC, query ASC
      LIMIT 10`,
    db.downloadActivity.groupBy({
      by: ["type"],
      where: { createdAt },
      _count: { _all: true },
    }),
    db.downloadActivity.groupBy({
      by: ["downloadId"],
      where: { createdAt, type: { in: ["QR_SCANNED", "EMAIL_SENT"] } },
      _count: { _all: true },
      orderBy: { _count: { downloadId: "desc" } },
      take: 8,
    }),
    db.feedback.aggregate({ where: { createdAt }, _avg: { rating: true } }),
    options.includeCaptures ? db.kioskSessionCapture.count({ where: { createdAt } }) : Promise.resolve(null),
  ]);

  const [labels, documents] = await Promise.all([
    resolvePageLabels([...pageRows, ...charterRows].map((row) => row.page)),
    documentRows.length
      ? db.download.findMany({
          where: { id: { in: documentRows.map((row) => row.downloadId) } },
          select: { id: true, titleEn: true },
        })
      : Promise.resolve([]),
  ]);
  const documentTitles = new Map(documents.map((doc) => [doc.id, doc.titleEn]));

  const seriesByKey = new Map(seriesRows.map((row) => [row.bucket, row]));
  const series = rangeBucketKeys(range).map((key) => ({
    key,
    visitors: seriesByKey.get(key)?.visitors ?? 0,
    pageViews: seriesByKey.get(key)?.page_views ?? 0,
  }));

  const hours = Array.from({ length: 24 }, () => 0);
  for (const row of hourRows) hours[row.hour] = row.views;

  const activityCount = Object.fromEntries(activityRows.map((row) => [row.type, row._count._all]));

  return {
    range,
    lastActivityAt: latest?.createdAt ?? null,
    totals,
    previousTotals,
    visits: {
      averageSeconds: visitRows[0]?.average_seconds ?? null,
      averagePages: visitRows[0]?.average_pages ?? null,
    },
    series,
    hours,
    topPages: pageRows.map((row) => ({
      key: row.page,
      label: labels.get(row.page) ?? row.page,
      count: row._count._all,
    })),
    charterLookups: charterRows
      .filter((row) => isCharterVisitKey(row.page))
      .map((row) => ({
        key: row.page,
        label: (labels.get(row.page) ?? row.page).replace(/^Charter (office|service): /, ""),
        count: row._count._all,
        detail: row.page.startsWith("charter:office:") ? "Office" : "Service",
      })),
    languages: languageRows
      .map((row) => ({
        key: row.language ?? "unknown",
        label: row.language ? (LANGUAGE_LABELS[row.language] ?? row.language) : "Not recorded",
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count),
    searches: {
      top: topSearchRows.map((row) => ({
        key: row.query,
        label: row.query,
        count: row.searches,
        detail: row.results === 0 ? "No results" : `${row.results} result${row.results === 1 ? "" : "s"}`,
      })),
      noResults: noResultRows.map((row) => ({ key: row.query, label: row.query, count: row.searches })),
    },
    downloads: {
      qrShown: activityCount.QR_GENERATED ?? 0,
      qrScanned: activityCount.QR_SCANNED ?? 0,
      emailsSent: activityCount.EMAIL_SENT ?? 0,
      topDocuments: documentRows.map((row) => ({
        key: row.downloadId,
        label: documentTitles.get(row.downloadId) ?? "Removed document",
        count: row._count._all,
      })),
    },
    feedbackAverage: feedbackStats._avg.rating,
    captures,
  };
}
