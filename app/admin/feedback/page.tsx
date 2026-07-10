import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminTable } from "@/components/admin/admin-table";

export default async function AdminFeedbackPage() {
  if (!(await auth())) redirect("/admin/login");
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
