import { db } from "@/lib/db";
import { AdminTable } from "@/components/admin/admin-table";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminFeedbackPage() {
  await requireAdminPage("manage_feedback");
  const items = await db.feedback.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <AdminTable
      title="Feedback"
      columns={[
        { key: "name", label: "Name" },
        { key: "rating", label: "Rating" },
        { key: "message", label: "Message" },
        { key: "createdAt", label: "Date" },
      ]}
      data={items.map((i) => ({
        id: i.id,
        name: i.name ?? "Anonymous",
        rating: i.rating ? String(i.rating) : "—",
        message: i.message.slice(0, 80) + (i.message.length > 80 ? "..." : ""),
        createdAt: i.createdAt.toLocaleDateString(),
      }))}
    />
  );
}
