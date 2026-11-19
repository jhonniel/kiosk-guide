import Link from "next/link";
import { requireAdminPage } from "@/lib/admin-page-auth";
import {
  getLatestKioskCapture,
  getRecentKioskCaptures,
  getSessionCaptureSummary,
} from "@/features/kiosk/session-capture-service";
import { resolvePageLabels } from "@/features/analytics/page-labels";
import { formatManilaDateTime } from "@/features/analytics/range";
import { AdminNotice, AdminPage, AdminPageHeader } from "@/components/admin/admin-page";

const LANGUAGE_NAMES: Record<string, string> = { en: "English", fil: "Filipino", bis: "Bisaya" };

function languageName(code: string | null) {
  return code ? (LANGUAGE_NAMES[code] ?? code) : "Language not recorded";
}

export default async function AdminKioskTrackingPage() {
  await requireAdminPage("manage_kiosk_tracking");

  const [latest, recent, sessions] = await Promise.all([
    getLatestKioskCapture(),
    getRecentKioskCaptures(24),
    getSessionCaptureSummary(12),
  ]);
  const labels = await resolvePageLabels([
    ...(latest ? [latest.page] : []),
    ...recent.map((row) => row.page),
    ...sessions.map((session) => session.lastPage),
  ]);
  const pageName = (page: string) => labels.get(page) ?? page;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Kiosk Tracking"
        description="Camera snapshots taken while visitors use the kiosk, newest first. Only administrators with Kiosk Tracking access can see them. Times are Philippine time."
      />

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-kiosk-navy">Last kiosk user</h2>
        {!latest ? (
          <AdminNotice>
            No snapshots yet. They appear once camera tracking is turned on in Settings and a visitor uses
            the kiosk with camera access allowed.
          </AdminNotice>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="relative aspect-[4/3] w-full max-w-72 shrink-0 overflow-hidden rounded-xl border bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/admin/kiosk-captures/${latest.id}/image`}
                alt="Most recent kiosk visitor"
                className="h-full w-full object-cover"
              />
            </div>
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Seen</dt>
                <dd className="text-kiosk-navy">{formatManilaDateTime(latest.createdAt)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Screen</dt>
                <dd className="text-kiosk-navy">{pageName(latest.page)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Language</dt>
                <dd className="text-kiosk-navy">{languageName(latest.language)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Visit</dt>
                <dd>
                  <Link
                    href={`/admin?range=all&session=${encodeURIComponent(latest.sessionId)}#activity`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    See everything this visitor did
                  </Link>
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-kiosk-navy">Recent visits</h2>
          {sessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No visits recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {sessions.map((session) => (
                <li key={session.sessionId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/admin/kiosk-captures/${session.latestCaptureId}/image`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium text-kiosk-navy">Last on {pageName(session.lastPage)}</p>
                    <p className="text-gray-500">{formatManilaDateTime(session.lastSeenAt)}</p>
                    <p className="text-xs text-gray-400">
                      {session.captureCount} snapshot{session.captureCount === 1 ? "" : "s"} ·{" "}
                      {languageName(session.language)}
                    </p>
                  </div>
                  <Link
                    href={`/admin?range=all&session=${encodeURIComponent(session.sessionId)}#activity`}
                    className="shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-kiosk-navy hover:bg-gray-50"
                  >
                    Activity
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-kiosk-navy">Recent snapshots</h2>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">No snapshots recorded yet.</p>
          ) : (
            <ul className="max-h-[420px] divide-y overflow-y-auto text-sm">
              {recent.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate text-kiosk-navy">{pageName(row.page)}</span>
                  <span className="shrink-0 text-gray-500 tabular-nums">{formatManilaDateTime(row.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminPage>
  );
}
