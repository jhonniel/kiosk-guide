import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_LOG_TYPES,
  type ActivityLogEntry,
  type ActivityLogFilters,
} from "@/features/analytics/activity-log-service";
import { formatManilaDateTime, type AnalyticsRangeKey } from "@/features/analytics/range";

const KIND_STYLES: Record<ActivityLogEntry["kind"], string> = {
  visit: "bg-slate-100 text-slate-700",
  search: "bg-violet-50 text-violet-700",
  download: "bg-blue-50 text-blue-700",
  feedback: "bg-emerald-50 text-emerald-700",
  capture: "bg-amber-50 text-amber-700",
};

const LANGUAGE_SHORT: Record<string, string> = { en: "EN", fil: "FIL", bis: "BIS" };

export function ActivityLogTable({
  range,
  filters,
  entries,
  total,
  page,
  pageCount,
  includeCaptures,
  hrefFor,
  exportHref,
}: {
  range: AnalyticsRangeKey;
  filters: ActivityLogFilters;
  entries: ActivityLogEntry[];
  total: number;
  page: number;
  pageCount: number;
  includeCaptures: boolean;
  hrefFor: (changes: { page?: number; session?: string | null }) => string;
  exportHref: string;
}) {
  const types = ACTIVITY_LOG_TYPES.filter((type) => type.key !== "capture" || includeCaptures);

  return (
    <section id="activity" className="scroll-mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="font-semibold text-kiosk-navy">Activity log</h2>
          <p className="text-xs text-gray-500">
            Every recorded kiosk event in this period, newest first · {total.toLocaleString()} event
            {total === 1 ? "" : "s"}
          </p>
        </div>
        <a
          href={exportHref}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-kiosk-navy hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <form method="get" action="/admin#activity" className="flex flex-wrap items-end gap-3 border-b bg-gray-50/60 px-5 py-3">
        <input type="hidden" name="range" value={range} />
        {filters.session ? <input type="hidden" name="session" value={filters.session} /> : null}
        <label className="grid gap-1 text-xs font-medium text-gray-500">
          Activity
          <select
            name="type"
            defaultValue={filters.type}
            className="h-9 rounded-lg border bg-white px-2 text-sm text-gray-800"
          >
            {types.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-56 flex-1 gap-1 text-xs font-medium text-gray-500">
          Search
          <span className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={filters.search ?? ""}
              placeholder="Page, search words, document or session"
              className="h-9 w-full rounded-lg border bg-white pr-3 pl-8 text-sm text-gray-800"
            />
          </span>
        </label>
        <button
          type="submit"
          className="h-9 rounded-lg bg-kiosk-navy px-4 text-sm font-medium text-white hover:bg-kiosk-navy/90"
        >
          Apply
        </button>
        {filters.session ? (
          <Link
            href={hrefFor({ session: null, page: 1 })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-kiosk-navy/20 bg-white px-3 text-sm text-kiosk-navy hover:bg-gray-50"
          >
            Session {filters.session.slice(0, 8)}
            <X className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </form>

      {entries.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-gray-500">No activity matches these filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 whitespace-nowrap">Date and time</th>
                <th className="px-5 py-3">Activity</th>
                <th className="px-5 py-3">Item</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3">Visitor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry, index) => (
                <tr key={`${page}-${index}`} className="align-top text-gray-600 hover:bg-gray-50/70">
                  <td className="px-5 py-3 whitespace-nowrap tabular-nums">{formatManilaDateTime(entry.at)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                        KIND_STYLES[entry.kind]
                      )}
                    >
                      {entry.event}
                    </span>
                  </td>
                  <td className="max-w-md px-5 py-3 font-medium break-words text-kiosk-navy">{entry.subject}</td>
                  <td className="px-5 py-3 text-xs break-words text-gray-500">{entry.detail ?? "—"}</td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    {entry.sessionId ? (
                      <Link
                        href={hrefFor({ session: entry.sessionId, page: 1 })}
                        className="font-mono text-xs text-blue-700 hover:underline"
                        title="Show everything this visitor did"
                      >
                        {entry.sessionId.slice(0, 8)}
                      </Link>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                    {entry.language ? (
                      <span className="ml-2 text-[11px] text-gray-400">
                        {LANGUAGE_SHORT[entry.language] ?? entry.language}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-sm text-gray-500">
        <span>
          Page {page.toLocaleString()} of {pageCount.toLocaleString()}
        </span>
        <div className="flex gap-2">
          <PageLink href={page > 1 ? hrefFor({ page: page - 1 }) : null} label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </PageLink>
          <PageLink href={page < pageCount ? hrefFor({ page: page + 1 }) : null} label="Next">
            <ChevronRight className="h-4 w-4" />
          </PageLink>
        </div>
      </div>
    </section>
  );
}

function PageLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const classes = "inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-sm";
  if (!href) {
    return (
      <span className={cn(classes, "cursor-not-allowed text-gray-300")} aria-disabled>
        {label === "Previous" ? children : null}
        {label}
        {label === "Next" ? children : null}
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} className={cn(classes, "text-kiosk-navy hover:bg-gray-50")}>
      {label === "Previous" ? children : null}
      {label}
      {label === "Next" ? children : null}
    </Link>
  );
}
