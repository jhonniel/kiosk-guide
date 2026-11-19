import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import {
  ADMIN_ROLE_NAME,
  type AdminPermissionName,
} from "@/features/admin/permissions";

/**
 * The signed-in admin session, or null. An account that was deactivated or deleted after signing in
 * keeps its cookie but loses its role on the next request, so it counts as signed out.
 */
export async function getAdminSession(): Promise<Session | null> {
  const session = await auth();
  return session?.user?.role ? session : null;
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function isFullAdmin(session: Session | null | undefined): boolean {
  return session?.user?.role === ADMIN_ROLE_NAME;
}

export function hasPermission(
  session: Session | null | undefined,
  permission: AdminPermissionName | string
): boolean {
  if (!session?.user) return false;
  if (isFullAdmin(session)) return true;
  return (session.user.permissions ?? []).includes(permission);
}

export function hasAnyPermission(
  session: Session | null | undefined,
  permissions: readonly string[]
): boolean {
  if (!session?.user) return false;
  if (isFullAdmin(session)) return true;
  const granted = new Set(session.user.permissions ?? []);
  return permissions.some((p) => granted.has(p));
}

/** Require a logged-in admin with a specific feature permission. */
export async function requirePermission(permission: AdminPermissionName | string) {
  const session = await requireAdmin();
  if (!hasPermission(session, permission)) {
    throw new Error("Forbidden");
  }
  return session;
}
