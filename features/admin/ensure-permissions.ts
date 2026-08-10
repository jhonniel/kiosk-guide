import { db } from "@/lib/db";
import { ADMIN_PERMISSIONS, ADMIN_ROLE_NAME } from "@/features/admin/permissions";

/** Upsert the permission catalog and attach every permission to the admin role. */
export async function ensureAdminPermissions() {
  for (const perm of ADMIN_PERMISSIONS) {
    await db.permission.upsert({
      where: { name: perm.name },
      update: {
        module: perm.module,
        description: perm.description,
      },
      create: {
        name: perm.name,
        module: perm.module,
        description: perm.description,
      },
    });
  }

  const adminRole = await db.role.upsert({
    where: { name: ADMIN_ROLE_NAME },
    update: {},
    create: {
      name: ADMIN_ROLE_NAME,
      description: "Full system administrator",
    },
  });

  const allPermissions = await db.permission.findMany({
    where: { name: { in: ADMIN_PERMISSIONS.map((p) => p.name) } },
  });

  for (const permission of allPermissions) {
    await db.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  return { adminRole, permissions: allPermissions };
}
