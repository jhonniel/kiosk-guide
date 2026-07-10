import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminTable } from "@/components/admin/admin-table";

export default async function AdminUsersPage() {
  if (!(await auth())) redirect("/admin/login");
  const items = await db.user.findMany({ include: { role: true } });
  return (
    <AdminTable
      title="Users"
      description="Manage admin users, roles, and permissions."
      columns={[
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "isActive", label: "Active" },
      ]}
      data={items.map((i) => ({
        id: i.id,
        name: i.name,
        email: i.email,
        role: i.role.name,
        isActive: i.isActive ? "Yes" : "No",
      }))}
    />
  );
}
