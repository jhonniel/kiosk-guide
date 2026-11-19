/** Kiosk analytics date ranges, bucketed in Philippine time (UTC+8, no daylight saving). */

export const ANALYTICS_TIME_ZONE = "Asia/Manila";
export const MANILA_OFFSET_HOURS = 8;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const OFFSET_MS = MANILA_OFFSET_HOURS * HOUR_MS;

export const ANALYTICS_RANGES = [
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "all", label: "All time", days: null },
] as const;

export type AnalyticsRangeKey = (typeof ANALYTICS_RANGES)[number]["key"];
export type AnalyticsBucket = "hour" | "day" | "month";

export type AnalyticsRange = {
  key: AnalyticsRangeKey;
  label: string;
  from: Date;
  to: Date;
  bucket: AnalyticsBucket;
  /** Same-length window right before `from`, for "vs previous period"; null for all time. */
  previous: { from: Date; to: Date } | null;
};

export function parseAnalyticsRangeKey(value: string | string[] | undefined): AnalyticsRangeKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return ANALYTICS_RANGES.some((range) => range.key === raw) ? (raw as AnalyticsRangeKey) : "7d";
}

/** Midnight (Manila) of the day containing `date`, as a UTC instant. */
export function startOfManilaDay(date: Date): Date {
  return new Date(Math.floor((date.getTime() + OFFSET_MS) / DAY_MS) * DAY_MS - OFFSET_MS);
}

export function resolveAnalyticsRange(
  key: AnalyticsRangeKey,
  earliestRecord: Date | null,
  now = new Date()
): AnalyticsRange {
  const definition = ANALYTICS_RANGES.find((range) => range.key === key) ?? ANALYTICS_RANGES[1];
  const to = new Date(startOfManilaDay(now).getTime() + DAY_MS);

  if (definition.days === null) {
    const from = startOfManilaDay(earliestRecord ?? now);
    const spanDays = (to.getTime() - from.getTime()) / DAY_MS;
    return {
      key: definition.key,
      label: definition.label,
      from,
      to,
      bucket: spanDays > 120 ? "month" : "day",
      previous: null,
    };
  }

  const span = definition.days * DAY_MS;
  const from = new Date(to.getTime() - span);
  return {
    key: definition.key,
    label: definition.label,
    from,
    to,
    bucket: definition.days === 1 ? "hour" : "day",
    previous: { from: new Date(from.getTime() - span), to: from },
  };
}

/** Bucket keys covering the range, matching the SQL `to_char` formats used by the analytics service. */
export function rangeBucketKeys(range: AnalyticsRange): string[] {
  const keys: string[] = [];
  if (range.bucket === "hour") {
    for (let hour = 0; hour < 24; hour++) keys.push(String(hour).padStart(2, "0"));
    return keys;
  }
  if (range.bucket === "day") {
    for (let t = range.from.getTime(); t < range.to.getTime(); t += DAY_MS) {
      keys.push(new Date(t + OFFSET_MS).toISOString().slice(0, 10));
    }
    return keys;
  }
  const cursor = new Date(range.from.getTime() + OFFSET_MS);
  cursor.setUTCDate(1);
  const end = new Date(range.to.getTime() + OFFSET_MS);
  while (cursor < end) {
    keys.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

export function formatBucketLabel(key: string, bucket: AnalyticsBucket): string {
  if (bucket === "hour") return formatHour(Number(key));
  if (bucket === "day") {
    return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }
  return new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

export function formatManilaDateTime(date: Date): string {
  return date.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ANALYTICS_TIME_ZONE,
  });
}
