import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [services, announcements, feedback, visitors, searches] = await Promise.all([
    db.service.count(),
    db.announcement.count(),
    db.feedback.count(),
    db.visitorLog.count(),
    db.searchLog.count(),
  ]);

  const stats = [
    { label: "Services", value: services },
    { label: "Announcements", value: announcements },
    { label: "Feedback", value: feedback },
    { label: "Visitor Logs", value: visitors },
    { label: "Search Logs", value: searches },
  ];

  const recentFeedback = await db.feedback.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-kiosk-navy">Dashboard</h1>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-kiosk-navy">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {recentFeedback.length === 0 ? (
            <p className="text-gray-500">No feedback yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentFeedback.map((item) => (
                <li key={item.id} className="border-b pb-3 last:border-0">
                  <p className="text-sm text-gray-700">{item.message}</p>
                  <p className="text-xs text-gray-400">{item.createdAt.toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
