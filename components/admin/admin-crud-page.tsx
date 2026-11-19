"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import { FormField, fieldId, type UploadedDocument } from "@/components/admin/admin-crud-fields";
import { createResource, deleteResource, updateResource } from "@/features/admin/actions";
import type { ResourceConfig, ResourceKey, ResourceField } from "@/features/admin/resource-definitions";
import {
  listToLines,
  slugify,
  toManilaInputValue,
  validateResourceValues,
} from "@/features/admin/resource-validation";
import { formatManilaDateTime } from "@/features/analytics/range";
import { cn } from "@/lib/utils";

type Item = Record<string, unknown>;

interface Props {
  resource: ResourceKey;
  config: ResourceConfig;
  items: Item[];
  /** Shown as a section inside another admin page: no page padding, smaller heading. */
  embedded?: boolean;
  /** Extra content between the heading and the list, e.g. a notice. */
  children?: React.ReactNode;
  /** Extra content under the "nothing here yet" message. */
  emptyExtra?: React.ReactNode;
}

const PAGE_SIZE = 20;

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getDefaultValues(fields: ResourceField[], items: Item[]): Item {
  const defaults: Item = {};
  for (const field of fields) {
    if (field.type === "boolean") defaults[field.key] = true;
    else if (field.key === "sortOrder") {
      // New records go to the end of the list.
      const last = items.reduce((max, item) => Math.max(max, Number(item.sortOrder) || 0), 0);
      defaults[field.key] = String(items.length ? last + 1 : 0);
    } else if (field.key === "floor") defaults[field.key] = "1";
    else defaults[field.key] = "";
  }
  return defaults;
}

function toFormValues(fields: ResourceField[], item: Item): Item {
  const values: Item = {};
  for (const field of fields) {
    const raw = item[field.key];
    if (field.type === "date") values[field.key] = toManilaInputValue(raw);
    else if (field.type === "boolean") values[field.key] = Boolean(raw);
    else if (field.type === "lines") values[field.key] = listToLines(raw);
    else if (field.type !== "file") values[field.key] = raw === null || raw === undefined ? "" : String(raw);
  }
  return values;
}

function StatusBadge({ tone, children }: { tone: "on" | "off" | "warning"; children: React.ReactNode }) {
  const tones = {
    on: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    off: "bg-gray-100 text-gray-600 ring-gray-500/20",
    warning: "bg-amber-50 text-amber-800 ring-amber-600/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

function cellText(value: unknown, field: ResourceField | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  if (value instanceof Date) return formatManilaDateTime(value);
  if (field?.type === "select") {
    return field.options?.find((option) => option.value === value)?.label ?? String(value);
  }
  if (typeof value === "number") return value.toLocaleString("en-PH");
  return String(value);
}

export function AdminCrudManager({ resource, config, items, embedded, children, emptyExtra }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Item>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const fieldByKey = useMemo(
    () => Object.fromEntries(config.fields.map((field) => [field.key, field])),
    [config.fields]
  );
  const titleKey = config.tableColumns[0].key;
  const titleOf = (item: Item) => String(item[titleKey] ?? "").trim() || `this ${config.singular}`;
  const hasSlugField = config.fields.some((field) => field.key === "slug");

  const suggestions = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const field of config.fields) {
      if (!field.suggest) continue;
      const values = new Set<string>();
      for (const item of items) {
        const value = String(item[field.key] ?? "").trim();
        if (value) values.add(value);
      }
      result[field.key] = [...values].sort((a, b) => a.localeCompare(b));
    }
    return result;
  }, [config.fields, items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      config.tableColumns.some((column) =>
        cellText(item[column.key], fieldByKey[column.key]).toLowerCase().includes(needle)
      )
    );
  }, [config.tableColumns, fieldByKey, items, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const editingItem = editingId ? items.find((item) => String(item.id) === editingId) : undefined;
  const brokenFile = resource === "downloads" && editingItem?.fileProblem ? String(editingItem.fileProblem) : null;

  function openForm(item: Item | null) {
    setEditingId(item ? String(item.id) : null);
    const values = item ? toFormValues(config.fields, item) : getDefaultValues(config.fields, items);
    if (resource === "downloads") {
      values.fileUrl = item?.fileUrl ?? "";
      values.fileName = item?.fileName ?? "";
      values.fileSize = item?.fileSize ?? "";
    }
    setForm(values);
    setErrors({});
    setServerError(null);
    setSlugEdited(Boolean(item));
    setDialogOpen(true);
  }

  function setField(key: string, value: unknown) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // While adding a record, the page address name follows the English title until it is typed by hand.
      if (key === "titleEn" && hasSlugField && !slugEdited) next.slug = slugify(String(value));
      return next;
    });
    if (key === "slug") setSlugEdited(true);
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (isPending || uploading) return;

    const problems = validateResourceValues(config, form);
    setErrors(problems);
    setServerError(null);
    const firstInvalid = config.fields.find((field) => problems[field.key]);
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid.key))?.focus();
      return;
    }

    startTransition(async () => {
      const result = editingId
        ? await updateResource(resource, editingId, form)
        : await createResource(resource, form);

      if (result.success) {
        toast.success(editingId ? "Changes saved" : `${capitalize(config.singular)} added`);
        setDialogOpen(false);
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget || isPending) return;
    const target = deleteTarget;
    startTransition(async () => {
      const result = await deleteResource(resource, String(target.id));
      if (result.success) {
        toast.success(`${capitalize(config.singular)} deleted`);
      } else {
        toast.error(result.error);
      }
      setDeleteTarget(null);
    });
  }

  const errorCount = Object.keys(errors).length;

  const content = (
    <>
      <AdminPageHeader
        as={embedded ? "h2" : "h1"}
        title={config.name}
        description={config.description}
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus />
            Add {config.singular}
          </Button>
        }
      />

      {children}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {items.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={`Search ${config.name.toLowerCase()}`}
                aria-label={`Search ${config.name.toLowerCase()}`}
                className="pl-8"
              />
            </div>
            <p className="text-sm text-gray-500" aria-live="polite">
              {query.trim()
                ? `${filtered.length} of ${items.length} shown`
                : `${items.length} ${items.length === 1 ? "record" : "records"}`}
            </p>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <div className="px-4 py-12 text-center">
            {items.length === 0 ? (
              <>
                <p className="font-medium text-gray-700">Nothing here yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Use “Add {config.singular}” to create the first one.
                </p>
                {emptyExtra ? <div className="mt-5">{emptyExtra}</div> : null}
              </>
            ) : (
              <>
                <p className="font-medium text-gray-700">Nothing matches “{query.trim()}”</p>
                <Button variant="outline" className="mt-3" onClick={() => setQuery("")}>
                  <X />
                  Clear search
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                <tr>
                  {config.tableColumns.map((column) => (
                    <th key={column.key} scope="col" className="px-4 py-3 whitespace-nowrap">
                      {column.label}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((item) => (
                  <tr key={String(item.id)} className="hover:bg-gray-50">
                    {config.tableColumns.map((column, index) => {
                      const value = item[column.key];
                      if (typeof value === "boolean") {
                        return (
                          <td key={column.key} className="px-4 py-3">
                            {resource === "downloads" && item.fileProblem ? (
                              <StatusBadge tone="warning">
                                <AlertTriangle className="h-3 w-3" />
                                File broken
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone={value ? "on" : "off"}>{value ? "Shown" : "Hidden"}</StatusBadge>
                            )}
                          </td>
                        );
                      }
                      const text = cellText(value, fieldByKey[column.key]);
                      return (
                        <td
                          key={column.key}
                          className={cn(
                            "max-w-md px-4 py-3",
                            index === 0 ? "font-medium text-kiosk-navy" : "text-gray-600"
                          )}
                        >
                          {text ? (
                            <span className="line-clamp-2 break-words" title={text.length > 80 ? text : undefined}>
                              {text}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openForm(item)}
                          aria-label={`Edit ${titleOf(item)}`}
                          title="Edit"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(item)}
                          aria-label={`Delete ${titleOf(item)}`}
                          title="Delete"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 ? (
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm text-gray-600">
            <p>
              Page {currentPage} of {pageCount}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                <ChevronLeft />
                Previous
              </Button>
              <Button variant="outline" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open || !isPending) && setDialogOpen(open)}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>{editingId ? `Edit ${config.singular}` : `Add ${config.singular}`}</DialogTitle>
            <DialogDescription>
              Fields marked <span className="text-destructive">*</span> are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {errorCount > 0 || serverError ? (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {serverError ??
                    (errorCount === 1
                      ? "One field needs your attention."
                      : `${errorCount} fields need your attention.`)}
                </p>
              ) : null}
              {brokenFile ? (
                <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    This document is turned off because its file is broken: {brokenFile} Upload a working copy and save
                    to turn it back on.
                  </span>
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                {config.fields.map((field) => (
                  <FormField
                    key={field.key}
                    field={field}
                    value={form[field.key]}
                    error={errors[field.key]}
                    suggestions={suggestions[field.key]}
                    document={
                      field.type === "file"
                        ? {
                            fileUrl: String(form.fileUrl ?? ""),
                            fileName: String(form.fileName ?? ""),
                            fileSize: String(form.fileSize ?? ""),
                          }
                        : undefined
                    }
                    uploadSlug={String(form.slug ?? "")}
                    disabled={isPending}
                    onChange={(value) => setField(field.key, value)}
                    onUploadingChange={setUploading}
                    onDocumentUploaded={(uploaded: UploadedDocument) => {
                      setForm((prev) => ({ ...prev, ...uploaded }));
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next[field.key];
                        return next;
                      });
                    }}
                  />
                ))}
              </div>
            </div>
            <DialogFooter className="mx-0 mb-0 px-5">
              <Button type="button" variant="outline" disabled={isPending} onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || uploading}>
                {isPending ? "Saving…" : uploading ? "Uploading…" : editingId ? "Save changes" : `Add ${config.singular}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && !isPending && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {config.singular}?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget ? titleOf(deleteTarget) : ""}” will be removed from the kiosk. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return embedded ? <section className="space-y-4">{content}</section> : <AdminPage>{content}</AdminPage>;
}
