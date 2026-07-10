"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  createResource,
  deleteResource,
  updateResource,
} from "@/features/admin/actions";
import type { ResourceConfig, ResourceKey, ResourceField } from "@/features/admin/resource-definitions";

interface Props {
  resource: ResourceKey;
  config: ResourceConfig;
  items: Record<string, unknown>[];
}

function getDefaultValues(fields: ResourceField[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "boolean") defaults[field.key] = true;
    else if (field.type === "number") defaults[field.key] = 0;
    else defaults[field.key] = "";
  }
  return defaults;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleDateString();
  const str = String(value);
  return str.length > 80 ? `${str.slice(0, 80)}...` : str;
}

function FormField({
  field,
  value,
  onChange,
  onFileUploaded,
  uploadSlug,
}: {
  field: ResourceField;
  value: unknown;
  onChange: (v: unknown) => void;
  onFileUploaded?: (payload: { fileUrl: string; fileName: string; fileSize: string }) => void;
  uploadSlug?: string;
}) {
  const [uploading, setUploading] = useState(false);

  if (field.type === "image") {
    const currentUrl = String(value ?? "");

    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        if (uploadSlug) body.append("slug", uploadSlug);
        const res = await fetch("/api/admin/files/upload-homepage-icon", {
          method: "POST",
          body,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");

        onChange(data.fileUrl);
        toast.success("Image uploaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    }

    return (
      <div className="space-y-2 rounded-lg border bg-gray-50 p-4">
        <Label htmlFor={field.key}>{field.label}</Label>
        {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
        {currentUrl ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-xl border bg-white">
            <Image
              src={currentUrl}
              alt={field.label}
              fill
              className="object-contain p-2"
              unoptimized
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">No image uploaded yet.</p>
        )}
        <div>
          <label
            htmlFor={field.key}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-kiosk-navy px-4 py-2 text-sm font-medium text-white hover:bg-kiosk-navy/90"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : currentUrl ? "Replace image" : "Upload image"}
          </label>
          <input
            id={field.key}
            type="file"
            className="hidden"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleImageChange}
            disabled={uploading}
          />
        </div>
      </div>
    );
  }

  if (field.type === "file") {
    const fileUrl = String((value as { fileUrl?: string } | string) ?? "");
    const currentUrl =
      typeof value === "object" && value !== null && "fileUrl" in value
        ? String((value as { fileUrl: string }).fileUrl)
        : fileUrl;

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/files/upload", {
          method: "POST",
          body,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");

        onFileUploaded?.({
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
        });
        toast.success("File uploaded");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    }

    return (
      <div className="space-y-2 rounded-lg border bg-gray-50 p-4">
        <Label htmlFor={field.key}>{field.label}</Label>
        {field.description && <p className="text-xs text-gray-500">{field.description}</p>}
        {currentUrl ? (
          <div className="flex items-center gap-2 text-sm text-kiosk-navy">
            <ExternalLink className="h-4 w-4 shrink-0" />
            <a href={currentUrl} target="_blank" rel="noreferrer" className="truncate underline">
              {currentUrl}
            </a>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No file uploaded yet.</p>
        )}
        <div>
          <label
            htmlFor={field.key}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-kiosk-navy px-4 py-2 text-sm font-medium text-white hover:bg-kiosk-navy/90"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : currentUrl ? "Replace file" : "Upload file"}
          </label>
          <input
            id={field.key}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        <Switch
          id={field.key}
          checked={Boolean(value)}
          onCheckedChange={onChange}
        />
      </div>
    );
  }

  if (field.type === "textarea" || field.type === "json") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={field.key}>{field.label}</Label>
        <Textarea
          id={field.key}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={field.type === "json" ? 6 : 3}
          placeholder={field.placeholder}
          className={field.type === "json" ? "font-mono text-xs" : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.key}>{field.label}</Label>
      <Input
        id={field.key}
        type={field.type === "number" ? "number" : field.type === "date" ? "datetime-local" : "text"}
        value={String(value ?? "")}
        onChange={(e) =>
          onChange(field.type === "number" ? Number(e.target.value) : e.target.value)
        }
        placeholder={field.placeholder}
        required={field.required}
      />
    </div>
  );
}

export function AdminCrudManager({ resource, config, items }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(getDefaultValues(config.fields));
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    const defaults = getDefaultValues(config.fields);
    if (resource === "downloads") {
      defaults.fileUrl = "";
      defaults.fileName = "";
      defaults.fileSize = "";
    }
    setForm(defaults);
    setDialogOpen(true);
  }

  function openEdit(item: Record<string, unknown>) {
    setEditingId(String(item.id));
    const values: Record<string, unknown> = {};
    for (const field of config.fields) {
      const raw = item[field.key];
      if (field.type === "date" && raw) {
        values[field.key] = new Date(String(raw)).toISOString().slice(0, 16);
      } else if (field.type === "boolean") {
        values[field.key] = Boolean(raw);
      } else if (field.type === "file") {
        values[field.key] = {
          fileUrl: item.fileUrl ?? "",
          fileName: item.fileName ?? "",
          fileSize: item.fileSize ?? "",
        };
      } else {
        values[field.key] = raw ?? "";
      }
    }
    if (resource === "downloads") {
      values.fileUrl = item.fileUrl ?? "";
      values.fileName = item.fileName ?? "";
      values.fileSize = item.fileSize ?? "";
    }
    setForm(values);
    setDialogOpen(true);
  }

  function setField(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (resource === "downloads") {
      if (!form.fileUrl || !form.fileName) {
        toast.error("Please upload a document file.");
        return;
      }
    }

    const payload = { ...form };
    delete payload.fileAsset;

    startTransition(async () => {
      const result = editingId
        ? await updateResource(resource, editingId, payload)
        : await createResource(resource, payload);

      if (result.success) {
        toast.success(editingId ? "Updated" : "Created");
        setDialogOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteResource(resource, deleteId);
      if (result.success) {
        toast.success("Deleted");
        setDeleteId(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kiosk-navy">{config.name}</h1>
          {config.description && <p className="text-gray-500">{config.description}</p>}
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              {config.tableColumns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold text-gray-600">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={config.tableColumns.length + 1}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  No records found. Click &quot;Add New&quot; to create one.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={String(item.id)} className="border-b last:border-0 hover:bg-gray-50">
                  {config.tableColumns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {formatCellValue(item[col.key])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(String(item.id))}
                        aria-label="Delete"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? `Edit ${config.name}` : `New ${config.name}`}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {config.fields.map((field) => (
              <FormField
                key={field.key}
                field={field}
                value={form[field.key]}
                onChange={(v) => setField(field.key, v)}
                uploadSlug={String(form.slug ?? "")}
                onFileUploaded={(uploaded) =>
                  setForm((prev) => ({
                    ...prev,
                    fileAsset: uploaded,
                    fileUrl: uploaded.fileUrl,
                    fileName: uploaded.fileName,
                    fileSize: uploaded.fileSize,
                  }))
                }
              />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
