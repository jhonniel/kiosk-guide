import { auth } from "@/lib/auth";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BarChart3, Mail, QrCode, ScanLine } from "lucide-react";
import { db } from "@/lib/db";
import { AdminCrudManager } from "@/components/admin/admin-crud-page";
import { RESOURCE_CONFIGS } from "@/features/admin/resource-definitions";

const activityLabels = {
  QR_GENERATED: "QR code generated",
  QR_SCANNED: "QR code scanned",
  EMAIL_SENT: "Sent via email",
} as const;

export default async function AdminDownloadsPage() {
  if (!(await auth())) redirect("/admin/login");

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

  const countByType = Object.fromEntries(
    activityCounts.map((item) => [item.type, item._count._all])
  );
  const qrScans = countByType.QR_SCANNED ?? 0;
  const emailSends = countByType.EMAIL_SENT ?? 0;
  const totalDownloads = qrScans + emailSends;

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-kiosk-navy">Download activity</h1>
          <p className="mt-1 text-sm text-gray-500">
            Successful QR scans and email deliveries are recorded automatically.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            icon={<BarChart3 className="h-5 w-5" />}
            label="Total downloads"
            value={totalDownloads}
            tone="navy"
          />
          <MetricCard
            icon={<ScanLine className="h-5 w-5" />}
            label="QR scans"
            value={qrScans}
            tone="blue"
          />
          <MetricCard
            icon={<Mail className="h-5 w-5" />}
            label="Email deliveries"
            value={emailSends}
            tone="green"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-kiosk-navy">Recent activity</h2>
            <p className="text-xs text-gray-500">Latest 50 delivery events</p>
          </div>
          <QrCode className="h-5 w-5 text-gray-400" />
        </div>

        {recentActivity.length ? (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Activity</th>
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">Date and time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActivity.map((activity) => (
                  <tr key={activity.id} className="text-gray-600">
                    <td className="px-5 py-3 font-medium text-kiosk-navy">
                      {activity.download.titleEn}
                    </td>
                    <td className="px-5 py-3">{activityLabels[activity.type]}</td>
                    <td className="px-5 py-3">{activity.recipientEmail ?? "—"}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {activity.createdAt.toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
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

      <AdminCrudManager
        resource="downloads"
        config={RESOURCE_CONFIGS.downloads}
        items={downloads as unknown as Record<string, unknown>[]}
      />
    </div>
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
