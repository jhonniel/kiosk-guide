import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ANALYTICS_RANGES,
  formatBucketLabel,
  formatHour,
  type AnalyticsBucket,
  type AnalyticsRangeKey,
} from "@/features/analytics/range";
import type { RankedItem } from "@/features/analytics/analytics-service";

export function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const rounded = Math.round(seconds);
  if (rounded < 60) return `${rounded}s`;
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
}

export function RangeTabs({
  active,
  hrefFor,
}: {
  active: AnalyticsRangeKey;
  hrefFor: (key: AnalyticsRangeKey) => string;
}) {
  return (
    <nav aria-label="Date range" className="inline-flex flex-wrap gap-1 rounded-xl border bg-white p-1 shadow-sm">
      {ANALYTICS_RANGES.map((range) => (
        <Link
          key={range.key}
          href={hrefFor(range.key)}
          aria-current={range.key === active ? "page" : undefined}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            range.key === active ? "bg-kiosk-navy text-white" : "text-gray-600 hover:bg-gray-100"
          )}
        >
          {range.label}
        </Link>
      ))}
    </nav>
  );
}

function Change({ current, previous }: { current: number; previous: number | undefined }) {
  if (previous === undefined) return null;
  if (previous === 0) {
    return current > 0 ? <span className="text-xs font-medium text-emerald-600">New this period</span> : null;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        change > 0 ? "text-emerald-600" : change < 0 ? "text-rose-600" : "text-gray-400"
      )}
      title={`Previous period: ${previous.toLocaleString()}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {change > 0 ? "+" : ""}
      {change}% vs previous
    </span>
  );
}

export function StatCard({
  icon,
  label,
  value,
  hint,
  current,
  previous,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  current?: number;
  previous?: number;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-kiosk-navy">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-kiosk-navy tabular-nums">{value}</p>
      <div className="mt-1 flex min-h-4 flex-wrap items-center gap-x-2">
        {current !== undefined ? <Change current={current} previous={previous} /> : null}
        {hint ? <span className="text-xs text-gray-400">{hint}</span> : null}
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-white p-5 shadow-sm", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-kiosk-navy">{title}</h2>
          {description ? <p className="text-xs text-gray-500">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function UsageChart({
  series,
  bucket,
}: {
  series: Array<{ key: string; visitors: number; pageViews: number }>;
  bucket: AnalyticsBucket;
}) {
  const peak = Math.max(0, ...series.map((point) => Math.max(point.visitors, point.pageViews)));
  const max = Math.max(2, Math.ceil(peak / 2) * 2);
  const labelEvery = Math.max(1, Math.ceil(series.length / 8));

  return (
    <div>
      <div className="mb-3 flex gap-4 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-kiosk-navy" /> Visitors
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sky-300" /> Page views
        </span>
      </div>
      <div className="flex gap-2">
        <div className="flex h-48 flex-col justify-between py-0.5 text-right text-[11px] text-gray-400 tabular-nums">
          <span>{max.toLocaleString()}</span>
          <span>{Math.round(max / 2).toLocaleString()}</span>
          <span>0</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative flex h-48 items-end gap-px border-b border-l border-gray-200">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-gray-100" />
            {series.map((point) => (
              <div
                key={point.key}
                className="group relative flex h-full min-w-0 flex-1 items-end justify-center px-px hover:bg-gray-50"
                title={`${formatBucketLabel(point.key, bucket)}: ${point.visitors.toLocaleString()} visitors, ${point.pageViews.toLocaleString()} page views`}
              >
                <div
                  className="relative w-full max-w-8 rounded-t-sm bg-sky-300"
                  style={{ height: `${(Math.max(point.pageViews, point.visitors) / max) * 100}%` }}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t-sm bg-kiosk-navy"
                    style={{
                      height: `${point.pageViews ? (Math.min(point.visitors, point.pageViews) / point.pageViews) * 100 : 100}%`,
                      minHeight: point.visitors > 0 ? 2 : 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex text-[11px] text-gray-400">
            {series.map((point, index) => (
              <span key={point.key} className="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap">
                {index % labelEvery === 0 ? formatBucketLabel(point.key, bucket) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HourChart({ hours }: { hours: number[] }) {
  const max = Math.max(1, ...hours);
  const peak = hours.indexOf(Math.max(...hours));
  const hasData = hours.some((value) => value > 0);

  return (
    <div>
      <p className="mb-3 text-sm text-gray-600">
        {hasData ? (
          <>
            Busiest at <span className="font-semibold text-kiosk-navy">{formatHour(peak)}</span>
          </>
        ) : (
          "No visits in this period."
        )}
      </p>
      <div className="flex h-36 items-end gap-0.5 border-b border-gray-200">
        {hours.map((value, hour) => (
          <div
            key={hour}
            className="flex h-full flex-1 items-end"
            title={`${formatHour(hour)}: ${value.toLocaleString()} page views`}
          >
            <div
              className={cn("w-full rounded-t-sm", hasData && hour === peak ? "bg-amber-500" : "bg-kiosk-navy/70")}
              style={{ height: `${(value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
        <span>12 AM</span>
        <span>6 AM</span>
        <span>12 PM</span>
        <span>6 PM</span>
        <span>11 PM</span>
      </div>
    </div>
  );
}

export function RankedList({
  items,
  empty,
  unit,
  barClassName = "bg-kiosk-navy/15",
}: {
  items: RankedItem[];
  empty: string;
  unit?: string;
  barClassName?: string;
}) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-gray-400">{empty}</p>;
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <ol className="space-y-1.5">
      {items.map((item, index) => (
        <li key={item.key} className="relative overflow-hidden rounded-lg px-3 py-2">
          <div
            className={cn("absolute inset-y-0 left-0 rounded-lg", barClassName)}
            style={{ width: `${(item.count / max) * 100}%` }}
          />
          <div className="relative flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="w-4 shrink-0 text-xs text-gray-400 tabular-nums">{index + 1}</span>
              <span className="truncate font-medium text-kiosk-navy" title={item.label}>
                {item.label}
              </span>
              {item.detail ? <span className="shrink-0 text-xs text-gray-400">{item.detail}</span> : null}
            </span>
            <span className="shrink-0 font-semibold text-kiosk-navy tabular-nums">
              {item.count.toLocaleString()}
              {unit ? <span className="ml-1 text-xs font-normal text-gray-400">{unit}</span> : null}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
