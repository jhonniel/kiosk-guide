import { requireAdminPage } from "@/lib/admin-page-auth";
import {
  getLatestKioskCapture,
  getRecentKioskCaptures,
  getSessionCaptureSummary,
} from "@/features/kiosk/session-capture-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminKioskTrackingPage() {
  await requireAdminPage("manage_kiosk_tracking");

  const [latest, recent, sessions] = await Promise.all([
    getLatestKioskCapture(),
    getRecentKioskCaptures(24),
    getSessionCaptureSummary(12),
  ]);

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-kiosk-navy">Kiosk User Tracking</h1>
      <p className="mb-6 max-w-3xl text-sm text-gray-600">
        Camera snapshots from the public kiosk are stored here for administrators only. The most
        recent visitor session appears first.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Last kiosk user</CardTitle>
        </CardHeader>
        <CardContent>
          {!latest ? (
            <p className="text-gray-500">No captures yet. Use the kiosk and allow camera access.</p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="relative h-48 w-64 shrink-0 overflow-hidden rounded-xl border bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/admin/kiosk-captures/${latest.id}/image`}
                  alt="Last kiosk user capture"
                  className="h-full w-full object-cover"
                />
              </div>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Last seen</dt>
                  <dd>{latest.createdAt.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Last page</dt>
                  <dd className="font-mono text-kiosk-navy">{latest.page}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Language</dt>
                  <dd>{latest.language ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Session</dt>
                  <dd className="break-all font-mono text-xs">{latest.sessionId}</dd>
                </div>
              </dl>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-gray-500">No sessions recorded.</p>
            ) : (
              <ul className="space-y-4">
                {sessions.map((session) => (
                  <li
                    key={session.sessionId}
                    className="flex items-center gap-3 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/admin/kiosk-captures/${session.latestCaptureId}/image`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium text-kiosk-navy">{session.lastPage}</p>
                      <p className="text-gray-500">{session.lastSeenAt.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">
                        {session.captureCount} capture{session.captureCount === 1 ? "" : "s"} ·{" "}
                        {session.language ?? "unknown language"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent captures</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-gray-500">No captures recorded.</p>
            ) : (
              <ul className="max-h-[420px] space-y-2 overflow-y-auto text-sm">
                {recent.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 border-b py-2">
                    <span className="truncate font-mono text-kiosk-navy">{row.page}</span>
                    <span className="shrink-0 text-gray-500">{row.createdAt.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
