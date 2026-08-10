"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ADMIN_PERMISSIONS, ADMIN_ROLE_NAME } from "@/features/admin/permissions";
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
} from "@/features/admin/user-actions";
import { cn } from "@/lib/utils";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roleName: string;
  permissions: string[];
};

type FormState = {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
  fullAdmin: boolean;
  permissions: string[];
};

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  password: "",
  isActive: true,
  fullAdmin: false,
  permissions: [],
});

interface Props {
  users: AdminUserRow[];
  currentUserId: string;
}

export function AdminUsersManager({ users, currentUserId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, startTransition] = useTransition();

  const editingUser = useMemo(
    () => users.find((u) => u.id === editingId) ?? null,
    [users, editingId]
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(user: AdminUserRow) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      isActive: user.isActive,
      fullAdmin: user.roleName === ADMIN_ROLE_NAME,
      permissions: user.permissions.filter((p) =>
        ADMIN_PERMISSIONS.some((catalog) => catalog.name === p)
      ),
    });
    setDialogOpen(true);
  }

  function togglePermission(name: string) {
    setForm((prev) => {
      const has = prev.permissions.includes(name);
      return {
        ...prev,
        permissions: has
          ? prev.permissions.filter((p) => p !== name)
          : [...prev.permissions, name],
      };
    });
  }

  function selectAllPermissions() {
    setForm((prev) => ({
      ...prev,
      permissions: ADMIN_PERMISSIONS.map((p) => p.name),
    }));
  }

  function clearPermissions() {
    setForm((prev) => ({ ...prev, permissions: [] }));
  }

  function handleSave() {
    startTransition(async () => {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        isActive: form.isActive,
        fullAdmin: form.fullAdmin,
        permissions: form.fullAdmin ? [] : form.permissions,
      };

      const result = editingId
        ? await updateAdminUser(editingId, payload)
        : await createAdminUser({ ...payload, password: form.password });

      if (result.success) {
        toast.success(editingId ? "User updated" : "User created");
        setDialogOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteAdminUser(deleteId);
      if (result.success) {
        toast.success("User deleted");
        setDeleteId(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-kiosk-navy">Users</h1>
          <p className="text-gray-500">
            Create admin accounts and choose which features each user can access.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Access</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Active</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isFull = user.roleName === ADMIN_ROLE_NAME;
                const featureLabels = ADMIN_PERMISSIONS.filter((p) =>
                  user.permissions.includes(p.name)
                ).map((p) => p.label);

                return (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {user.name}
                      {user.id === currentUserId && (
                        <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      {isFull ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <Shield className="h-3 w-3" />
                          Full administrator
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">
                          {featureLabels.length > 0
                            ? featureLabels.slice(0, 4).join(", ") +
                              (featureLabels.length > 4
                                ? ` +${featureLabels.length - 4} more`
                                : "")
                            : "No features"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          user.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {user.isActive ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(user)}
                          aria-label="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(user.id)}
                          aria-label="Delete user"
                          disabled={user.id === currentUserId}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user-name">Name</Label>
                <Input
                  id="user-name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="jane@camiguin.gov.ph"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">
                Password {editingId ? "(leave blank to keep current)" : ""}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder={editingId ? "••••••••" : "Minimum 6 characters"}
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-gray-500">Inactive users cannot sign in</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-emerald-900">Full administrator</p>
                <p className="text-xs text-emerald-800/80">
                  Access to every admin feature, including user management
                </p>
              </div>
              <Switch
                checked={form.fullAdmin}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, fullAdmin: checked }))}
              />
            </div>

            {!form.fullAdmin && (
              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Feature access</p>
                    <p className="text-xs text-gray-500">
                      Choose which admin modules this user can open
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAllPermissions}>
                      Select all
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={clearPermissions}>
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                  {ADMIN_PERMISSIONS.map((perm) => {
                    const checked = form.permissions.includes(perm.name);
                    return (
                      <label
                        key={perm.name}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
                          checked
                            ? "border-kiosk-navy/30 bg-kiosk-navy/5"
                            : "border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={() => togglePermission(perm.name)}
                        />
                        <span>
                          <span className="block text-sm font-medium text-gray-900">
                            {perm.label}
                          </span>
                          <span className="block text-xs text-gray-500">{perm.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {editingUser && (
              <p className="text-xs text-gray-500">
                Permission changes apply on the user&apos;s next page load / session refresh.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the account. They will no longer be able to sign in to the
              admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={pending}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
