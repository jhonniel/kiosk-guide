import type { ReactNode } from "react";
import { BarChart3, ChevronDown, FileWarning, Mail, QrCode, ScanLine } from "lucide-react";
import { db } from "@/lib/db";
import { AdminCrudManager } from "@/components/admin/admin-crud-page";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { formatManilaDateTime } from "@/features/analytics/range";
import { RESOURCE_CONFIGS } from "@/features/admin/resource-definitions";
import { requireAdminPage } from "@/lib/admin-page-auth";

const activityLabels = {
  QR_GENERATED: "QR code generated",
  QR_SCANNED: "QR code scanned",
  EMAIL_SENT: "Sent via email",
} as const;

export default async function AdminDownloadsPage() {
  await requireAdminPage("manage_downloads");

  const [downloads, activityCounts, recentActivity] = await Promise.all([
    db.download.findMany({
      orderBy: [{ downloadCount: "desc" }, { sortOrder: "asc" }],
    }),
    db.downloadActivity.groupBy({
      by: ["type"],
      _count: { _all: true },
    }),
    db.downloadActivity.findMany({
      include: {
        download: { select: { titleEn: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const brokenDownloads = downloads.filter((item) => item.fileProblem);

  const countByType = Object.fromEntries(
    activityCounts.map((item) => [item.type, item._count._all])
  );
  const qrScans = countByType.QR_SCANNED ?? 0;
  const emailSends = countByType.EMAIL_SENT ?? 0;
  const totalDownloads = qrScans + emailSends;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Downloads"
        description="Documents offered in the kiosk Download Center, and how often they are sent to visitors."
      />

      {brokenDownloads.length > 0 ? (
        <details className="group rounded-xl border border-amber-200 bg-amber-50">
          <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
            <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-amber-900">
                {brokenDownloads.length} document{brokenDownloads.length === 1 ? " is" : "s are"} turned off because
                the file is broken
              </span>
              <span className="mt-1 block text-sm text-amber-800">
                The kiosk will not send these by QR or email. Edit each one, upload a working copy and save; it
                turns back on automatically.
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-amber-900">
              <span className="group-open:hidden">Show list</span>
              <span className="hidden group-open:inline">Hide list</span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <ul className="mx-4 mb-4 divide-y divide-amber-200/70 overflow-hidden rounded-lg border border-amber-200 bg-white text-sm">
            {brokenDownloads.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5">
                <span className="font-medium text-kiosk-navy">{item.titleEn}</span>
                <span className="text-gray-500">
                  {item.fileProblem}
                  {item.fileProblemAt ? ` · ${formatManilaDateTime(item.fileProblemAt)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard icon={<BarChart3 className="h-5 w-5" />} label="Total deliveries" value={totalDownloads} tone="navy" />
        <MetricCard icon={<ScanLine className="h-5 w-5" />} label="QR scans" value={qrScans} tone="blue" />
        <MetricCard icon={<Mail className="h-5 w-5" />} label="Email deliveries" value={emailSends} tone="green" />
      </div>

      <AdminCrudManager
        embedded
        resource="downloads"
        config={RESOURCE_CONFIGS.downloads}
        items={downloads as unknown as Record<string, unknown>[]}
      />

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-kiosk-navy">Recent activity</h2>
            <p className="text-xs text-gray-500">
              Latest 50 delivery events. QR scans and emails sent are recorded automatically.
            </p>
          </div>
          <QrCode className="h-5 w-5 text-gray-400" />
        </div>

        {recentActivity.length ? (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th scope="col" className="px-5 py-3">Document</th>
                  <th scope="col" className="px-5 py-3">Activity</th>
                  <th scope="col" className="px-5 py-3">Recipient</th>
                  <th scope="col" className="px-5 py-3">Date and time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="text-gray-600">
                    <td className="px-5 py-3 font-medium text-kiosk-navy">{activity.download.titleEn}</td>
                    <td className="px-5 py-3">{activityLabels[activity.type]}</td>
                    <td className="px-5 py-3">{activity.recipientEmail ?? "—"}</td>
                    <td className="px-5 py-3 whitespace-nowrap">{formatManilaDateTime(activity.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-gray-500">
            Download activity will appear here after the first QR scan or email delivery.
          </p>
        )}
      </section>
    </AdminPage>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "navy" | "blue" | "green";
}) {
  const tones = {
    navy: "bg-slate-100 text-kiosk-navy",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold text-kiosk-navy">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
