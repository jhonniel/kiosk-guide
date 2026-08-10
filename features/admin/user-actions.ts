"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { ensureAdminPermissions } from "@/features/admin/ensure-permissions";
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLE_NAME,
  type AdminPermissionName,
} from "@/features/admin/permissions";

type ActionResult = { success: true } | { success: false; error: string };

const permissionNames = ADMIN_PERMISSIONS.map((p) => p.name) as [
  AdminPermissionName,
  ...AdminPermissionName[],
];

const userInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  isActive: z.boolean(),
  fullAdmin: z.boolean(),
  permissions: z.array(z.enum(permissionNames)),
});

function customRoleName(userId: string) {
  return `user-access:${userId}`;
}

async function resolveRoleId(options: {
  userId: string;
  fullAdmin: boolean;
  permissions: string[];
  existingRoleId?: string;
  existingRoleName?: string;
}) {
  const { adminRole, permissions: catalog } = await ensureAdminPermissions();

  if (options.fullAdmin) {
    return adminRole.id;
  }

  if (options.permissions.length === 0) {
    throw new Error("Select at least one feature, or enable Full administrator.");
  }

  const selected = catalog.filter((p) => options.permissions.includes(p.name));
  if (selected.length === 0) {
    throw new Error("Selected features are invalid.");
  }

  const roleName = customRoleName(options.userId);
  const role = await db.role.upsert({
    where: { name: roleName },
    update: {
      description: "Custom feature access",
    },
    create: {
      name: roleName,
      description: "Custom feature access",
    },
  });

  await db.rolePermission.deleteMany({ where: { roleId: role.id } });
  await db.rolePermission.createMany({
    data: selected.map((p) => ({
      roleId: role.id,
      permissionId: p.id,
    })),
  });

  // Clean up a previous custom role if the user moved away from it
  if (
    options.existingRoleId &&
    options.existingRoleName &&
    options.existingRoleName.startsWith("user-access:") &&
    options.existingRoleId !== role.id
  ) {
    const stillUsed = await db.user.count({
      where: { roleId: options.existingRoleId, NOT: { id: options.userId } },
    });
    if (stillUsed === 0) {
      await db.role.delete({ where: { id: options.existingRoleId } }).catch(() => null);
    }
  }

  return role.id;
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  fullAdmin: boolean;
  permissions: string[];
}): Promise<ActionResult> {
  try {
    await requirePermission("manage_users");

    const parsed = userInputSchema.safeParse({
      ...input,
      password: input.password,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    if (!parsed.data.password) {
      return { success: false, error: "Password is required for new users" };
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "A user with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    // Create user with temporary admin role, then assign the real role (needs user id for custom role name)
    const { adminRole } = await ensureAdminPermissions();
    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        password: passwordHash,
        isActive: parsed.data.isActive,
        roleId: adminRole.id,
      },
    });

    try {
      const roleId = await resolveRoleId({
        userId: user.id,
        fullAdmin: parsed.data.fullAdmin,
        permissions: parsed.data.permissions,
      });
      if (roleId !== user.roleId) {
        await db.user.update({ where: { id: user.id }, data: { roleId } });
      }
    } catch (error) {
      await db.user.delete({ where: { id: user.id } }).catch(() => null);
      throw error;
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    if (message === "Unauthorized" || message === "Forbidden") {
      return { success: false, error: message };
    }
    return { success: false, error: message };
  }
}

export async function updateAdminUser(
  userId: string,
  input: {
    name: string;
    email: string;
    password?: string;
    isActive: boolean;
    fullAdmin: boolean;
    permissions: string[];
  }
): Promise<ActionResult> {
  try {
    const session = await requirePermission("manage_users");

    const parsed = userInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) return { success: false, error: "User not found" };

    const email = parsed.data.email.toLowerCase();
    if (email !== user.email) {
      const taken = await db.user.findUnique({ where: { email } });
      if (taken) return { success: false, error: "A user with this email already exists" };
    }

    // Prevent locking yourself out of user management
    if (session.user.id === userId) {
      if (!parsed.data.isActive) {
        return { success: false, error: "You cannot deactivate your own account" };
      }
      if (!parsed.data.fullAdmin && !parsed.data.permissions.includes("manage_users")) {
        return {
          success: false,
          error: "You cannot remove your own Users access",
        };
      }
    }

    // Keep at least one active full admin
    if (
      user.role.name === ADMIN_ROLE_NAME &&
      (!parsed.data.fullAdmin || !parsed.data.isActive)
    ) {
      const otherAdmins = await db.user.count({
        where: {
          id: { not: userId },
          isActive: true,
          role: { name: ADMIN_ROLE_NAME },
        },
      });
      if (otherAdmins === 0) {
        return {
          success: false,
          error: "Keep at least one active full administrator",
        };
      }
    }

    const roleId = await resolveRoleId({
      userId,
      fullAdmin: parsed.data.fullAdmin,
      permissions: parsed.data.permissions,
      existingRoleId: user.roleId,
      existingRoleName: user.role.name,
    });

    const data: {
      name: string;
      email: string;
      isActive: boolean;
      roleId: string;
      password?: string;
    } = {
      name: parsed.data.name,
      email,
      isActive: parsed.data.isActive,
      roleId,
    };

    if (parsed.data.password) {
      data.password = await bcrypt.hash(parsed.data.password, 12);
    }

    await db.user.update({ where: { id: userId }, data });

    // If switching to full admin, remove unused custom role
    if (parsed.data.fullAdmin && user.role.name.startsWith("user-access:")) {
      const stillUsed = await db.user.count({ where: { roleId: user.roleId } });
      if (stillUsed === 0) {
        await db.role.delete({ where: { id: user.roleId } }).catch(() => null);
      }
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    if (message === "Unauthorized" || message === "Forbidden") {
      return { success: false, error: message };
    }
    return { success: false, error: message };
  }
}

export async function deleteAdminUser(userId: string): Promise<ActionResult> {
  try {
    const session = await requirePermission("manage_users");
    if (session.user.id === userId) {
      return { success: false, error: "You cannot delete your own account" };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) return { success: false, error: "User not found" };

    if (user.role.name === ADMIN_ROLE_NAME) {
      const otherAdmins = await db.user.count({
        where: {
          id: { not: userId },
          isActive: true,
          role: { name: ADMIN_ROLE_NAME },
        },
      });
      if (otherAdmins === 0) {
        return { success: false, error: "Keep at least one active full administrator" };
      }
    }

    const roleId = user.roleId;
    const roleName = user.role.name;
    await db.user.delete({ where: { id: userId } });

    if (roleName.startsWith("user-access:")) {
      const stillUsed = await db.user.count({ where: { roleId } });
      if (stillUsed === 0) {
        await db.role.delete({ where: { id: roleId } }).catch(() => null);
      }
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    if (message === "Unauthorized" || message === "Forbidden") {
      return { success: false, error: message };
    }
    return { success: false, error: message };
  }
}
