import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { isCharterVisitKey, resolvePageLabels } from "@/features/analytics/page-labels";
import type { AnalyticsRange } from "@/features/analytics/range";

export const ACTIVITY_LOG_TYPES = [
  { key: "all", label: "All activity" },
  { key: "visit", label: "Page visits" },
  { key: "search", label: "Searches" },
  { key: "download", label: "Downloads" },
  { key: "feedback", label: "Feedback" },
  { key: "capture", label: "Camera captures" },
] as const;

export type ActivityLogType = (typeof ACTIVITY_LOG_TYPES)[number]["key"];

export const ACTIVITY_LOG_PAGE_SIZE = 25;
export const ACTIVITY_LOG_EXPORT_LIMIT = 50_000;

export type ActivityLogFilters = {
  type: ActivityLogType;
  /** Kiosk visitor session; download and feedback events carry no session, so they drop out. */
  session?: string;
  search?: string;
};

/** What the signed-in admin may see inside the log. */
export type ActivityLogAccess = {
  includeCaptures: boolean;
  showDownloadRecipients: boolean;
  showFeedbackContacts: boolean;
};

export type ActivityLogEntry = {
  kind: Exclude<ActivityLogType, "all">;
  at: Date;
  event: string;
  subject: string;
  detail: string | null;
  sessionId: string | null;
  language: string | null;
};

type LogRow = {
  kind: ActivityLogEntry["kind"];
  at: Date;
  subject: string | null;
  extra: string | null;
  contact: string | null;
  session_id: string | null;
  language: string | null;
};

const DOWNLOAD_EVENTS: Record<string, string> = {
  QR_GENERATED: "QR code shown",
  QR_SCANNED: "QR code scanned",
  EMAIL_SENT: "Sent by email",
};

export function parseActivityLogType(value: string | string[] | undefined): ActivityLogType {
  const raw = Array.isArray(value) ? value[0] : value;
  return ACTIVITY_LOG_TYPES.some((type) => type.key === raw) ? (raw as ActivityLogType) : "all";
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "Hidden";
  return `${name.slice(0, 2)}***@${domain}`;
}

function sourceQueries(range: AnalyticsRange, filters: ActivityLogFilters, access: ActivityLogAccess) {
  const wants = (kind: ActivityLogType) => filters.type === "all" || filters.type === kind;
  const inRange = (column: string) =>
    Prisma.sql`${Prisma.raw(column)} >= ${range.from} AND ${Prisma.raw(column)} < ${range.to}`;
  const sessionFilter = filters.session ? Prisma.sql`AND "sessionId" = ${filters.session}` : Prisma.empty;

  const parts: Prisma.Sql[] = [];
  if (wants("visit")) {
    parts.push(Prisma.sql`
      SELECT 'visit' AS kind, "createdAt" AS at, page AS subject, NULL::text AS extra, NULL::text AS contact,
        "sessionId" AS session_id, language
      FROM "VisitorLog" WHERE ${inRange(`"createdAt"`)} ${sessionFilter}`);
  }
  if (wants("search")) {
    parts.push(Prisma.sql`
      SELECT 'search' AS kind, "createdAt" AS at, query AS subject, results::text AS extra, NULL::text AS contact,
        "sessionId" AS session_id, NULL::text AS language
      FROM "SearchLog" WHERE ${inRange(`"createdAt"`)} ${sessionFilter}`);
  }
  if (wants("download") && !filters.session) {
    parts.push(Prisma.sql`
      SELECT 'download' AS kind, a."createdAt" AS at, d."titleEn" AS subject, a.type::text AS extra,
        a."recipientEmail" AS contact, NULL::text AS session_id, NULL::text AS language
      FROM "DownloadActivity" a JOIN "Download" d ON d.id = a."downloadId"
      WHERE ${inRange(`a."createdAt"`)}`);
  }
  if (wants("feedback") && !filters.session) {
    parts.push(Prisma.sql`
      SELECT 'feedback' AS kind, "createdAt" AS at, message AS subject, rating::text AS extra,
        NULLIF(concat_ws(' · ', name, email), '') AS contact, NULL::text AS session_id, NULL::text AS language
      FROM "Feedback" WHERE ${inRange(`"createdAt"`)}`);
  }
  if (wants("capture") && access.includeCaptures) {
    parts.push(Prisma.sql`
      SELECT 'capture' AS kind, "createdAt" AS at, page AS subject, NULL::text AS extra, NULL::text AS contact,
        "sessionId" AS session_id, language
      FROM "KioskSessionCapture" WHERE ${inRange(`"createdAt"`)} ${sessionFilter}`);
  }
  return parts;
}

function searchFilter(search: string | undefined) {
  const term = search?.trim();
  if (!term) return Prisma.empty;
  const pattern = `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
  return Prisma.sql`WHERE subject ILIKE ${pattern} OR session_id ILIKE ${pattern}`;
}

async function toEntries(rows: LogRow[], access: ActivityLogAccess): Promise<ActivityLogEntry[]> {
  const labels = await resolvePageLabels(
    rows.filter((row) => row.kind === "visit" || row.kind === "capture").map((row) => row.subject ?? "")
  );

  return rows.map((row) => {
    const base = { kind: row.kind, at: row.at, sessionId: row.session_id, language: row.language };
    const subject = row.subject ?? "";
    switch (row.kind) {
      case "visit":
        return {
          ...base,
          event: isCharterVisitKey(subject) ? "Citizens' Charter lookup" : "Page visit",
          subject: labels.get(subject) ?? subject,
          detail: isCharterVisitKey(subject) ? null : subject,
        };
      case "search": {
        const results = Number(row.extra ?? 0);
        return {
          ...base,
          event: "Search",
          subject: `“${subject}”`,
          detail: results === 0 ? "No results" : `${results} result${results === 1 ? "" : "s"}`,
        };
      }
      case "download":
        return {
          ...base,
          event: DOWNLOAD_EVENTS[row.extra ?? ""] ?? "Download",
          subject,
          detail: row.contact
            ? `To ${access.showDownloadRecipients ? row.contact : maskEmail(row.contact)}`
            : null,
        };
      case "feedback": {
        const rating = row.extra ? `Rated ${row.extra}/5` : null;
        const from = row.contact && access.showFeedbackContacts ? `From ${row.contact}` : null;
        return {
          ...base,
          event: "Feedback",
          subject: subject || rating || "Survey response",
          detail: [subject ? rating : null, from].filter(Boolean).join(" · ") || null,
        };
      }
      case "capture":
        return { ...base, event: "Camera capture", subject: labels.get(subject) ?? subject, detail: null };
    }
  });
}

export async function listActivityLogs(
  range: AnalyticsRange,
  filters: ActivityLogFilters,
  access: ActivityLogAccess,
  page: number
): Promise<{ entries: ActivityLogEntry[]; total: number; page: number; pageCount: number }> {
  const parts = sourceQueries(range, filters, access);
  if (parts.length === 0) return { entries: [], total: 0, page: 1, pageCount: 1 };

  const union = Prisma.join(parts, " UNION ALL ");
  const where = searchFilter(filters.search);
  const countRows = await db.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*)::int AS total FROM (${union}) logs ${where}`;
  const total = countRows[0]?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / ACTIVITY_LOG_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);

  const rows = await db.$queryRaw<LogRow[]>`
    SELECT * FROM (${union}) logs ${where}
    ORDER BY at DESC
    LIMIT ${ACTIVITY_LOG_PAGE_SIZE} OFFSET ${(current - 1) * ACTIVITY_LOG_PAGE_SIZE}`;

  return { entries: await toEntries(rows, access), total, page: current, pageCount };
}

export async function exportActivityLogs(
  range: AnalyticsRange,
  filters: ActivityLogFilters,
  access: ActivityLogAccess
): Promise<ActivityLogEntry[]> {
  const parts = sourceQueries(range, filters, access);
  if (parts.length === 0) return [];

  const rows = await db.$queryRaw<LogRow[]>`
    SELECT * FROM (${Prisma.join(parts, " UNION ALL ")}) logs ${searchFilter(filters.search)}
    ORDER BY at DESC
    LIMIT ${ACTIVITY_LOG_EXPORT_LIMIT}`;
  return toEntries(rows, access);
}
