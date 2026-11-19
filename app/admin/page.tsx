import { BarChart3, Clock3, Download, MessageSquare, MousePointerClick, Search, Users } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-page-auth";
import { db } from "@/lib/db";
import { getKioskAnalytics } from "@/features/analytics/analytics-service";
import { listActivityLogs, parseActivityLogType, type ActivityLogFilters } from "@/features/analytics/activity-log-service";
import { activityLogAccessFor } from "@/features/analytics/access";
import { formatManilaDateTime, parseAnalyticsRangeKey, type AnalyticsRangeKey } from "@/features/analytics/range";
import {
  formatDuration,
  HourChart,
  Panel,
  RangeTabs,
  RankedList,
  StatCard,
  UsageChart,
} from "@/components/admin/analytics-widgets";
import { ActivityLogTable } from "@/components/admin/activity-log-table";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireAdminPage();
  const params = await searchParams;

  const rangeKey = parseAnalyticsRangeKey(params.range);
  const filters: ActivityLogFilters = {
    type: parseActivityLogType(params.type),
    session: firstParam(params.session),
    search: firstParam(params.q),
  };
  const logPage = Number.parseInt(firstParam(params.page) ?? "1", 10) || 1;
  const access = activityLogAccessFor(session);

  const analytics = await getKioskAnalytics(rangeKey, { includeCaptures: access.includeCaptures });
  const [logs, services, announcements, downloadsCount, faqs] = await Promise.all([
    listActivityLogs(analytics.range, filters, access, logPage),
    db.service.count(),
    db.announcement.count(),
    db.download.count({ where: { isActive: true } }),
    db.faq.count(),
  ]);

  const query = (changes: {
    range?: AnalyticsRangeKey;
    page?: number;
    session?: string | null;
  }) => {
    const next = new URLSearchParams();
    const range = changes.range ?? rangeKey;
    const sessionFilter = changes.session === undefined ? filters.session : changes.session;
    if (range !== "7d") next.set("range", range);
    if (filters.type !== "all") next.set("type", filters.type);
    if (filters.search) next.set("q", filters.search);
    if (sessionFilter) next.set("session", sessionFilter);
    if (changes.page && changes.page > 1) next.set("page", String(changes.page));
    return next.toString();
  };
  const dashboardHref = (changes: Parameters<typeof query>[0], hash = "") => {
    const qs = query(changes);
    return `/admin${qs ? `?${qs}` : ""}${hash}`;
  };

  const { totals, previousTotals: previous, range } = analytics;
  const delivered = analytics.downloads.qrScanned + analytics.downloads.emailsSent;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Dashboard"
        description={`Kiosk usage · ${range.label}${
          analytics.lastActivityAt ? ` · Last activity ${formatManilaDateTime(analytics.lastActivityAt)}` : ""
        }`}
        actions={<RangeTabs active={rangeKey} hrefFor={(key) => dashboardHref({ range: key, page: 1 })} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Visitors"
          value={totals.visitors.toLocaleString()}
          current={totals.visitors}
          previous={previous?.visitors}
          hint={analytics.captures != null ? `${analytics.captures.toLocaleString()} camera captures` : undefined}
        />
        <StatCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Page views"
          value={totals.pageViews.toLocaleString()}
          current={totals.pageViews}
          previous={previous?.pageViews}
        />
        <StatCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Average visit"
          value={formatDuration(analytics.visits.averageSeconds)}
          hint={
            analytics.visits.averagePages != null
              ? `${analytics.visits.averagePages.toFixed(1)} pages per visit`
              : undefined
          }
        />
        <StatCard
          icon={<Search className="h-4 w-4" />}
          label="Searches"
          value={totals.searches.toLocaleString()}
          current={totals.searches}
          previous={previous?.searches}
        />
        <StatCard
          icon={<Download className="h-4 w-4" />}
          label="Downloads"
          value={delivered.toLocaleString()}
          current={delivered}
          previous={previous?.downloads}
          hint={`${analytics.downloads.qrShown.toLocaleString()} QR codes shown`}
        />
        <StatCard
          icon={<MessageSquare className="h-4 w-4" />}
          label="Feedback"
          value={totals.feedback.toLocaleString()}
          current={totals.feedback}
          previous={previous?.feedback}
          hint={analytics.feedbackAverage != null ? `Average ${analytics.feedbackAverage.toFixed(1)} / 5` : undefined}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title={range.bucket === "hour" ? "Usage today by hour" : range.bucket === "month" ? "Usage by month" : "Usage by day"}
          description="A visitor is one kiosk session; a new one starts each time the idle screen comes back."
        >
          <UsageChart series={analytics.series} bucket={range.bucket} />
        </Panel>
        <Panel title="Busiest hours" description="Page views by time of day (Philippine time)">
          <HourChart hours={analytics.hours} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Most visited pages" description="Kiosk screens opened by visitors">
          <RankedList items={analytics.topPages} empty="No page visits in this period." />
        </Panel>
        <Panel title="Citizens' Charter lookups" description="Offices and services opened in the charter">
          <RankedList
            items={analytics.charterLookups}
            empty="No charter lookups in this period."
            barClassName="bg-amber-100"
          />
        </Panel>
        <Panel title="Languages" description="Page views by kiosk language">
          <RankedList items={analytics.languages} empty="No visits in this period." barClassName="bg-sky-100" />
        </Panel>
        <Panel title="Top searches" description="What visitors typed in the search bar">
          <RankedList
            items={analytics.searches.top}
            empty="Searches made on the kiosk will appear here."
            barClassName="bg-violet-100"
          />
        </Panel>
        <Panel
          title="Searches with no results"
          description="Topics visitors looked for but the kiosk had nothing on"
        >
          <RankedList
            items={analytics.searches.noResults}
            empty="Every search found something."
            barClassName="bg-rose-100"
          />
        </Panel>
        <Panel title="Downloads" description="Documents delivered by QR scan or email">
          <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "QR shown", value: analytics.downloads.qrShown },
              { label: "QR scanned", value: analytics.downloads.qrScanned },
              { label: "Emailed", value: analytics.downloads.emailsSent },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-gray-50 px-2 py-2.5">
                <dd className="text-lg font-bold text-kiosk-navy tabular-nums">{item.value.toLocaleString()}</dd>
                <dt className="text-[11px] text-gray-500">{item.label}</dt>
              </div>
            ))}
          </dl>
          <RankedList
            items={analytics.downloads.topDocuments}
            empty="No documents delivered in this period."
            barClassName="bg-blue-100"
          />
        </Panel>
      </div>

      <ActivityLogTable
        range={rangeKey}
        filters={filters}
        entries={logs.entries}
        total={logs.total}
        page={logs.page}
        pageCount={logs.pageCount}
        includeCaptures={access.includeCaptures}
        hrefFor={(changes) => dashboardHref(changes, "#activity")}
        exportHref={`/api/admin/activity-logs/export?${new URLSearchParams({
          range: rangeKey,
          type: filters.type,
          ...(filters.search ? { q: filters.search } : {}),
          ...(filters.session ? { session: filters.session } : {}),
        }).toString()}`}
      />

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
        <BarChart3 className="h-3.5 w-3.5" />
        <span>Published on the kiosk:</span>
        <span>{services.toLocaleString()} services</span>
        <span>{announcements.toLocaleString()} announcements</span>
        <span>{downloadsCount.toLocaleString()} downloadable files</span>
        <span>{faqs.toLocaleString()} FAQs</span>
      </p>
    </AdminPage>
  );
}
