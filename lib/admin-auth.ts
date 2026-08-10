import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import {
  ADMIN_ROLE_NAME,
  type AdminPermissionName,
} from "@/features/admin/permissions";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
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
