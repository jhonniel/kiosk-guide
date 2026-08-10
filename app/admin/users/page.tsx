import { db } from "@/lib/db";
import { ensureAdminPermissions } from "@/features/admin/ensure-permissions";
import { AdminUsersManager } from "@/components/admin/admin-users-manager";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function AdminUsersPage() {
  const session = await requireAdminPage("manage_users");
  await ensureAdminPermissions();

  const items = await db.user.findMany({
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <AdminUsersManager
      currentUserId={session.user.id}
      users={items.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        roleName: user.role.name,
        permissions: user.role.permissions.map((rp) => rp.permission.name),
      }))}
    />
  );
}
