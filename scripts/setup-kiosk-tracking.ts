import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const perm = await prisma.permission.upsert({
    where: { name: "manage_kiosk_tracking" },
    update: { module: "kiosk-tracking", description: "View kiosk visitor camera captures" },
    create: {
      name: "manage_kiosk_tracking",
      module: "kiosk-tracking",
      description: "View kiosk visitor camera captures",
    },
  });

  const admin = await prisma.role.findUnique({ where: { name: "admin" } });
  if (admin) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: admin.id, permissionId: perm.id } },
      update: {},
      create: { roleId: admin.id, permissionId: perm.id },
    });
  }

  await prisma.setting.upsert({
    where: { key: "kiosk_camera_tracking_enabled" },
    update: { value: "false", group: "display" },
    create: { key: "kiosk_camera_tracking_enabled", value: "false", group: "display" },
  });

  console.log("Kiosk tracking permission and setting ready.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
