import { redirect } from "next/navigation";
import { getAdminSession, hasPermission } from "@/lib/admin-auth";
import type { AdminPermissionName } from "@/features/admin/permissions";
import type { Session } from "next-auth";

/** Gate an admin page: login required, optional feature permission. */
export async function requireAdminPage(
  permission?: AdminPermissionName
): Promise<Session> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (permission && !hasPermission(session, permission)) {
    redirect("/admin");
  }
  return session;
}
