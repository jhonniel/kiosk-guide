"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page";
import {
  ConfirmDialog,
  NameDialog,
  type ConfirmRequest,
  type NameRequest,
} from "@/components/admin/admin-dialogs";
import { cn } from "@/lib/utils";
import type {
  CharterEditionView,
  CharterMedicineView,
  CharterRequirementView,
  CharterServiceView,
  CharterStepView,
} from "@/features/citizens-charter/types";
import {
  deleteCharterCategory,
  deleteCharterOffice,
  deleteCharterService,
  duplicateCharterService,
  publishCharterDraft,
  reorderCharterCategories,
  reorderCharterOffices,
  reorderCharterServices,
  replaceCharterMedicines,
  replaceCharterRequirements,
  replaceCharterSteps,
  updateCharterEditionSettings,
  upsertCharterCategory,
  upsertCharterOffice,
  upsertCharterService,
} from "@/features/citizens-charter/actions";

type TabKey = "general" | "requirements" | "steps" | "medicines";

interface Props {
  /** The draft edition as stored; it refreshes by itself after every saved change. */
  initialDraft: CharterEditionView;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** Server messages are plain sentences; anything else (hidden production errors, validation dumps) is replaced. */
function readableError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (!message || message.length > 160 || /^[\[{]/.test(message) || message.includes("Server Components")) {
    return "That could not be saved. Refresh the page and try again.";
  }
  if (message === "Unauthorized") return "Your session has ended. Sign in again.";
  if (message === "Forbidden") return "You do not have permission to do this.";
  return message;
}

function IconAction({
  label,
  className,
  children,
  ...props
}: { label: string } & React.ComponentProps<typeof Button>) {
  return (
    <Button size="icon" variant="ghost" aria-label={label} title={label} className={cn("h-7 w-7", className)} {...props}>
      {children}
    </Button>
  );
}

export function CitizensCharterAdminClient({ initialDraft: edition }: Props) {
  const [settings, setSettings] = useState({
    title: edition.title,
    editionLabel: edition.editionLabel,
    year: String(edition.year),
    description: edition.description,
    pdfUrl: edition.pdfUrl,
    pdfFileName: edition.pdfFileName,
  });
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("general");
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [nameRequest, setNameRequest] = useState<NameRequest | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  // The selection falls back to the first item, so it stays valid after a delete.
  const selectedOffice =
    edition.offices.find((office) => office.id === selectedOfficeId) ?? edition.offices[0] ?? null;
  const selectedCategory =
    selectedOffice?.categories.find((category) => category.id === selectedCategoryId) ??
    selectedOffice?.categories[0] ??
    null;
  const selectedService =
    selectedCategory?.services.find((service) => service.id === selectedServiceId) ??
    selectedCategory?.services[0] ??
    null;

  /** Runs a server action; the page data refreshes in place, keeping the current selection. */
  function run<T>(action: () => Promise<T>, success: string, onDone?: (result: T) => void) {
    startTransition(async () => {
      try {
        const result = await action();
        toast.success(success);
        setNameRequest(null);
        setConfirmRequest(null);
        onDone?.(result);
      } catch (error) {
        toast.error(readableError(error));
      }
    });
  }

  async function handlePdfUpload(file: File) {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("That file is too large. The limit is 25 MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/files/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "The upload failed. Please try again.");
      setSettings((current) => ({
        ...current,
        pdfUrl: data.fileUrl ?? data.url ?? current.pdfUrl,
        pdfFileName: data.fileName ?? file.name,
      }));
      toast.success("PDF uploaded. Save the edition settings to keep it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function saveSettings() {
    const year = Number(settings.year);
    const missing = [
      [settings.title, "Title"],
      [settings.editionLabel, "Edition label"],
      [settings.pdfUrl, "PDF link"],
      [settings.pdfFileName, "PDF file name"],
    ].find(([value]) => !value.trim());
    if (missing) {
      toast.error(`${missing[1]} is required.`);
      return;
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      toast.error("Year must be between 2000 and 2100.");
      return;
    }
    run(
      () =>
        updateCharterEditionSettings({
          editionId: edition.id,
          title: settings.title.trim(),
          year,
          editionLabel: settings.editionLabel.trim(),
          description: settings.description,
          pdfUrl: settings.pdfUrl.trim(),
          pdfFileName: settings.pdfFileName.trim(),
        }),
      "Edition settings saved"
    );
  }

  const listClassName = "max-h-[70vh] space-y-1 overflow-y-auto xl:max-h-[30vh] 2xl:max-h-[70vh]";

  return (
    <AdminPage>
      <AdminPageHeader
        title="Citizens' Charter"
        description={
          <>
            Changes are saved to a draft. Visitors see them on the kiosk only after you publish.
            <span className="mt-1 block text-xs font-medium text-amber-700">
              Draft · {plural(edition.serviceCount, "service")} · not published yet
            </span>
          </>
        }
        actions={
          <>
            <Link
              href="/citizens-charter"
              target="_blank"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border bg-white px-2.5 text-sm font-medium hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              View live page
            </Link>
            <Button
              disabled={pending}
              className="bg-kiosk-green hover:bg-kiosk-green/90"
              onClick={() =>
                setConfirmRequest({
                  title: "Publish this draft?",
                  description:
                    "The kiosk will show this draft right away. The edition that is live now is archived, and a fresh draft is made for further editing.",
                  confirmLabel: "Publish",
                  onConfirm: () => run(() => publishCharterDraft(edition.id), "The draft is now live on the kiosk"),
                })
              }
            >
              Publish draft
            </Button>
          </>
        }
      />

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold tracking-wide text-kiosk-navy uppercase">
          Edition settings
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="charter-title">Title</Label>
            <Input
              id="charter-title"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="charter-label">Edition label</Label>
            <Input
              id="charter-label"
              value={settings.editionLabel}
              onChange={(e) => setSettings({ ...settings, editionLabel: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="charter-year">Year</Label>
            <Input
              id="charter-year"
              type="number"
              min={2000}
              max={2100}
              value={settings.year}
              onChange={(e) => setSettings({ ...settings, year: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="charter-pdf-name">PDF file name</Label>
            <Input
              id="charter-pdf-name"
              value={settings.pdfFileName}
              onChange={(e) => setSettings({ ...settings, pdfFileName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="charter-description">Description</Label>
            <Textarea
              id="charter-description"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              className="mt-1"
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="charter-pdf-url">PDF link</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              <Input
                id="charter-pdf-url"
                value={settings.pdfUrl}
                onChange={(e) => setSettings({ ...settings, pdfUrl: e.target.value })}
                className="min-w-0 flex-1"
              />
              <label
                className={cn(
                  "inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium hover:bg-gray-50",
                  "focus-within:ring-3 focus-within:ring-ring/50",
                  uploading && "pointer-events-none opacity-60"
                )}
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handlePdfUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </div>
        <Button className="mt-4" disabled={pending || uploading} onClick={saveSettings}>
          <Save />
          Save edition settings
        </Button>
      </section>

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[260px_260px_minmax(0,1fr)]">
        <div className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:contents">
          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-kiosk-navy uppercase">Offices</h2>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  setNameRequest({
                    title: "Add office",
                    label: "Office name",
                    submitLabel: "Add office",
                    onSubmit: (name) =>
                      run(
                        () => upsertCharterOffice({ editionId: edition.id, name }),
                        "Office added",
                        (result) => {
                          setSelectedOfficeId(result.id ?? null);
                          setSelectedCategoryId(null);
                          setSelectedServiceId(null);
                        }
                      ),
                  })
                }
              >
                <Plus />
                Add
              </Button>
            </div>
            {edition.offices.length === 0 ? (
              <p className="text-sm text-gray-500">No offices yet. Add the first one.</p>
            ) : (
              <ul className={listClassName}>
                {edition.offices.map((office, index) => {
                  const isSelected = selectedOffice?.id === office.id;
                  const serviceCount = office.categories.reduce((n, c) => n + c.services.length, 0);
                  return (
                    <li key={office.id} className="rounded-lg border border-transparent hover:border-gray-200">
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedOfficeId(office.id);
                          setSelectedCategoryId(null);
                          setSelectedServiceId(null);
                        }}
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left text-sm",
                          isSelected ? "bg-kiosk-navy text-white" : "hover:bg-gray-50"
                        )}
                      >
                        <span className="block font-medium">{office.name}</span>
                        <span className={cn("text-[11px]", isSelected ? "text-white/70" : "text-gray-500")}>
                          {plural(serviceCount, "service")}
                          {!office.isActive ? " · hidden" : ""}
                        </span>
                      </button>
                      <div className="flex gap-1 px-2 pb-2">
                        <IconAction
                          label={`Move ${office.name} up`}
                          disabled={pending || index === 0}
                          onClick={() =>
                            run(
                              () =>
                                reorderCharterOffices(
                                  edition.id,
                                  moveItem(edition.offices, index, index - 1).map((item) => item.id)
                                ),
                              "Office order updated"
                            )
                          }
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction
                          label={`Move ${office.name} down`}
                          disabled={pending || index === edition.offices.length - 1}
                          onClick={() =>
                            run(
                              () =>
                                reorderCharterOffices(
                                  edition.id,
                                  moveItem(edition.offices, index, index + 1).map((item) => item.id)
                                ),
                              "Office order updated"
                            )
                          }
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction
                          label={`Rename ${office.name}`}
                          disabled={pending}
                          onClick={() =>
                            setNameRequest({
                              title: "Rename office",
                              label: "Office name",
                              initialValue: office.name,
                              submitLabel: "Save name",
                              onSubmit: (name) =>
                                run(
                                  () =>
                                    upsertCharterOffice({
                                      editionId: edition.id,
                                      id: office.id,
                                      name,
                                      isActive: office.isActive,
                                      sortOrder: office.sortOrder,
                                    }),
                                  "Office renamed"
                                ),
                            })
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction
                          label={office.isActive ? `Hide ${office.name} on the kiosk` : `Show ${office.name} on the kiosk`}
                          disabled={pending}
                          onClick={() =>
                            run(
                              () =>
                                upsertCharterOffice({
                                  editionId: edition.id,
                                  id: office.id,
                                  name: office.name,
                                  isActive: !office.isActive,
                                  sortOrder: office.sortOrder,
                                }),
                              office.isActive ? "Office hidden" : "Office shown"
                            )
                          }
                        >
                          {office.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </IconAction>
                        <IconAction
                          label={`Delete ${office.name}`}
                          className="text-red-600"
                          disabled={pending}
                          onClick={() =>
                            setConfirmRequest({
                              title: "Delete this office?",
                              description: `“${office.name}” and its ${office.categories.length} ${office.categories.length === 1 ? "category" : "categories"} and ${plural(serviceCount, "service")} will be removed from the draft. This cannot be undone.`,
                              confirmLabel: "Delete office",
                              destructive: true,
                              onConfirm: () => run(() => deleteCharterOffice(office.id), "Office deleted"),
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconAction>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-kiosk-navy uppercase">Categories</h2>
              <Button
                size="sm"
                variant="outline"
                disabled={pending || !selectedOffice}
                onClick={() => {
                  if (!selectedOffice) return;
                  const officeId = selectedOffice.id;
                  setNameRequest({
                    title: "Add category",
                    label: "Category name",
                    initialValue: "External Services",
                    submitLabel: "Add category",
                    onSubmit: (name) =>
                      run(
                        () => upsertCharterCategory({ officeId, name }),
                        "Category added",
                        (result) => {
                          setSelectedCategoryId(result.id ?? null);
                          setSelectedServiceId(null);
                        }
                      ),
                  });
                }}
              >
                <Plus />
                Add
              </Button>
            </div>
            {!selectedOffice ? (
              <p className="text-sm text-gray-500">Select an office first.</p>
            ) : selectedOffice.categories.length === 0 ? (
              <p className="text-sm text-gray-500">This office has no categories yet.</p>
            ) : (
              <ul className={listClassName}>
                {selectedOffice.categories.map((category, index) => {
                  const isSelected = selectedCategory?.id === category.id;
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setSelectedServiceId(null);
                        }}
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left text-sm",
                          isSelected ? "bg-emerald-600 text-white" : "hover:bg-gray-50"
                        )}
                      >
                        <span className="block font-medium">{category.name}</span>
                        <span className={cn("text-[11px]", isSelected ? "text-white/70" : "text-gray-500")}>
                          {plural(category.services.length, "service")}
                        </span>
                      </button>
                      <div className="flex gap-1 px-2 pb-2">
                        <IconAction
                          label={`Move ${category.name} up`}
                          disabled={pending || index === 0}
                          onClick={() =>
                            run(
                              () =>
                                reorderCharterCategories(
                                  selectedOffice.id,
                                  moveItem(selectedOffice.categories, index, index - 1).map((item) => item.id)
                                ),
                              "Category order updated"
                            )
                          }
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction
                          label={`Move ${category.name} down`}
                          disabled={pending || index === selectedOffice.categories.length - 1}
                          onClick={() =>
                            run(
                              () =>
                                reorderCharterCategories(
                                  selectedOffice.id,
                                  moveItem(selectedOffice.categories, index, index + 1).map((item) => item.id)
                                ),
                              "Category order updated"
                            )
                          }
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction
                          label={`Rename ${category.name}`}
                          disabled={pending}
                          onClick={() =>
                            setNameRequest({
                              title: "Rename category",
                              label: "Category name",
                              initialValue: category.name,
                              submitLabel: "Save name",
                              onSubmit: (name) =>
                                run(
                                  () =>
                                    upsertCharterCategory({
                                      officeId: selectedOffice.id,
                                      id: category.id,
                                      name,
                                      isActive: category.isActive,
                                      sortOrder: category.sortOrder,
                                    }),
                                  "Category renamed"
                                ),
                            })
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </IconAction>
                        <IconAction
                          label={`Delete ${category.name}`}
                          className="text-red-600"
                          disabled={pending}
                          onClick={() =>
                            setConfirmRequest({
                              title: "Delete this category?",
                              description: `“${category.name}” and its ${plural(category.services.length, "service")} will be removed from the draft. This cannot be undone.`,
                              confirmLabel: "Delete category",
                              destructive: true,
                              onConfirm: () => run(() => deleteCharterCategory(category.id), "Category deleted"),
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconAction>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-kiosk-navy uppercase">Services</h2>
            <Button
              size="sm"
              variant="outline"
              disabled={pending || !selectedCategory}
              onClick={() => {
                if (!selectedCategory) return;
                const categoryId = selectedCategory.id;
                setNameRequest({
                  title: "Add service",
                  label: "Service name",
                  submitLabel: "Add service",
                  onSubmit: (name) =>
                    run(
                      () => upsertCharterService({ categoryId, name }),
                      "Service added",
                      (result) => {
                        setSelectedServiceId(result.id ?? null);
                        setTab("general");
                      }
                    ),
                });
              }}
            >
              <Plus />
              Add
            </Button>
          </div>

          {!selectedCategory ? (
            <p className="text-sm text-gray-500">Select a category first.</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
              {selectedCategory.services.length === 0 ? (
                <p className="text-sm text-gray-500">This category has no services yet.</p>
              ) : (
                <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
                  {selectedCategory.services.map((service, index) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <li key={service.id} className="overflow-hidden rounded-lg border">
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => {
                            setSelectedServiceId(service.id);
                            setTab("general");
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm",
                            isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                          )}
                        >
                          <span className="block font-medium text-kiosk-navy">{service.name}</span>
                          <span className="text-[11px] text-gray-500">
                            {service.pageNumber != null ? `Page ${service.pageNumber}` : "No page number"}
                            {!service.isActive ? " · hidden" : ""}
                          </span>
                        </button>
                        <div className="flex flex-wrap gap-1 px-2 pb-2">
                          <IconAction
                            label={`Move ${service.name} up`}
                            disabled={pending || index === 0}
                            onClick={() =>
                              run(
                                () =>
                                  reorderCharterServices(
                                    selectedCategory.id,
                                    moveItem(selectedCategory.services, index, index - 1).map((item) => item.id)
                                  ),
                                "Service order updated"
                              )
                            }
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </IconAction>
                          <IconAction
                            label={`Move ${service.name} down`}
                            disabled={pending || index === selectedCategory.services.length - 1}
                            onClick={() =>
                              run(
                                () =>
                                  reorderCharterServices(
                                    selectedCategory.id,
                                    moveItem(selectedCategory.services, index, index + 1).map((item) => item.id)
                                  ),
                                "Service order updated"
                              )
                            }
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </IconAction>
                          <IconAction
                            label={`Duplicate ${service.name}`}
                            disabled={pending}
                            onClick={() =>
                              run(
                                () => duplicateCharterService(service.id),
                                "Service duplicated",
                                (result) => {
                                  setSelectedServiceId(result.id);
                                  setTab("general");
                                }
                              )
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </IconAction>
                          <IconAction
                            label={`Delete ${service.name}`}
                            className="text-red-600"
                            disabled={pending}
                            onClick={() =>
                              setConfirmRequest({
                                title: "Delete this service?",
                                description: `“${service.name}” with its requirements and steps will be removed from the draft. This cannot be undone.`,
                                confirmLabel: "Delete service",
                                destructive: true,
                                onConfirm: () => run(() => deleteCharterService(service.id), "Service deleted"),
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </IconAction>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {selectedService ? (
                <ServiceEditor
                  key={selectedService.id}
                  service={selectedService}
                  pending={pending}
                  tab={tab}
                  onTabChange={setTab}
                  onSaveGeneral={(payload) => {
                    if (!payload.name.trim()) {
                      toast.error("Service name is required.");
                      return;
                    }
                    run(
                      () =>
                        upsertCharterService({
                          categoryId: selectedCategory.id,
                          id: selectedService.id,
                          ...payload,
                        }),
                      "Service saved"
                    );
                  }}
                  onSaveRequirements={(rows) =>
                    run(
                      () => replaceCharterRequirements(selectedService.id, rows),
                      "Requirements saved"
                    )
                  }
                  onSaveSteps={(rows) =>
                    run(() => replaceCharterSteps(selectedService.id, rows), "Steps saved")
                  }
                  onSaveMedicines={(rows) =>
                    run(
                      () => replaceCharterMedicines(selectedService.id, rows),
                      "Medicine list saved"
                    )
                  }
                />
              ) : (
                <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed text-sm text-gray-500">
                  {selectedCategory.services.length === 0 ? "Add a service to start editing." : "Select a service to edit."}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <NameDialog request={nameRequest} pending={pending} onCancel={() => setNameRequest(null)} />
      <ConfirmDialog request={confirmRequest} pending={pending} onCancel={() => setConfirmRequest(null)} />
    </AdminPage>
  );
}

function ServiceEditor({
  service,
  pending,
  tab,
  onTabChange,
  onSaveGeneral,
  onSaveRequirements,
  onSaveSteps,
  onSaveMedicines,
}: {
  service: CharterServiceView;
  pending: boolean;
  tab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onSaveGeneral: (payload: {
    name: string;
    pageNumber: number | null;
    description: string;
    officeOrDivision: string;
    classification: string;
    typeOfTransaction: string;
    whoMayAvail: string;
    details: string[];
    isActive: boolean;
  }) => void;
  onSaveRequirements: (
    rows: Array<{ requirement: string; whereToSecure: string; isSection: boolean; isActive: boolean }>
  ) => void;
  onSaveSteps: (
    rows: Array<{
      step: string;
      action: string;
      fee: string;
      time: string;
      person: string;
      isActive: boolean;
    }>
  ) => void;
  onSaveMedicines: (
    rows: Array<{
      name: string;
      preparation: string;
      brand: string;
      price: string;
      isSection: boolean;
      isActive: boolean;
    }>
  ) => void;
}) {
  const [draft, setDraft] = useState(service);
  const [detailsText, setDetailsText] = useState(service.details.join("\n"));
  const [requirements, setRequirements] = useState<CharterRequirementView[]>(service.requirements);
  const [steps, setSteps] = useState<CharterStepView[]>(service.steps);
  const [medicines, setMedicines] = useState<CharterMedicineView[]>(service.medicines);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "general", label: "General" },
    { key: "requirements", label: "Requirements" },
    { key: "steps", label: "Process Steps" },
    { key: "medicines", label: "Medicines" },
  ];

  return (
    <div className="rounded-lg border bg-slate-50/60 p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onTabChange(item.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              tab === item.key ? "bg-kiosk-navy text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-3">
          <div>
            <Label>Service name</Label>
            <Input
              className="mt-1"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Source page</Label>
              <Input
                className="mt-1"
                type="number"
                value={draft.pageNumber ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    pageNumber: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                />
                Visible on kiosk
              </label>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-1"
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Office or Division</Label>
              <Input
                className="mt-1"
                value={draft.officeOrDivision}
                onChange={(e) => setDraft({ ...draft, officeOrDivision: e.target.value })}
              />
            </div>
            <div>
              <Label>Classification</Label>
              <Input
                className="mt-1"
                value={draft.classification}
                onChange={(e) => setDraft({ ...draft, classification: e.target.value })}
              />
            </div>
            <div>
              <Label>Type of Transaction</Label>
              <Input
                className="mt-1"
                value={draft.typeOfTransaction}
                onChange={(e) => setDraft({ ...draft, typeOfTransaction: e.target.value })}
              />
            </div>
            <div>
              <Label>Who may avail</Label>
              <Input
                className="mt-1"
                value={draft.whoMayAvail}
                onChange={(e) => setDraft({ ...draft, whoMayAvail: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Extra details (one per line)</Label>
            <Textarea
              className="mt-1"
              rows={3}
              value={detailsText}
              onChange={(e) => setDetailsText(e.target.value)}
            />
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              onSaveGeneral({
                name: draft.name,
                pageNumber: draft.pageNumber,
                description: draft.description,
                officeOrDivision: draft.officeOrDivision,
                classification: draft.classification,
                typeOfTransaction: draft.typeOfTransaction,
                whoMayAvail: draft.whoMayAvail,
                details: detailsText
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean),
                isActive: draft.isActive,
              })
            }
          >
            <Save className="mr-2 h-4 w-4" />
            Save general
          </Button>
        </div>
      )}

      {tab === "requirements" && (
        <RepeatableTable
          pending={pending}
          emptyLabel="No requirements yet"
          onAdd={() =>
            setRequirements((rows) => [
              ...rows,
              {
                id: `tmp-${Date.now()}`,
                requirement: "",
                whereToSecure: "",
                isSection: false,
                isActive: true,
                sortOrder: rows.length,
              },
            ])
          }
          onSave={() =>
            onSaveRequirements(
              requirements.map((row) => ({
                requirement: row.requirement,
                whereToSecure: row.whereToSecure,
                isSection: row.isSection,
                isActive: row.isActive,
              }))
            )
          }
        >
          {requirements.map((row, index) => (
            <div key={row.id} className="grid gap-2 rounded-lg border bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                placeholder={row.isSection ? "Section title" : "Requirement"}
                value={row.requirement}
                onChange={(e) =>
                  setRequirements((rows) =>
                    rows.map((item, i) =>
                      i === index ? { ...item, requirement: e.target.value } : item
                    )
                  )
                }
              />
              <Input
                placeholder="Where to secure"
                disabled={row.isSection}
                value={row.whereToSecure}
                onChange={(e) =>
                  setRequirements((rows) =>
                    rows.map((item, i) =>
                      i === index ? { ...item, whereToSecure: e.target.value } : item
                    )
                  )
                }
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={row.isSection}
                    onChange={(e) =>
                      setRequirements((rows) =>
                        rows.map((item, i) =>
                          i === index ? { ...item, isSection: e.target.checked } : item
                        )
                      )
                    }
                  />
                  Section
                </label>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Move requirement up"
                  title="Move up"
                  onClick={() => setRequirements((rows) => moveItem(rows, index, index - 1))}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Move requirement down"
                  title="Move down"
                  onClick={() => setRequirements((rows) => moveItem(rows, index, index + 1))}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
                  aria-label="Remove requirement"
                  title="Remove"
                  onClick={() =>
                    setRequirements((rows) => rows.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </RepeatableTable>
      )}

      {tab === "steps" && (
        <RepeatableTable
          pending={pending}
          emptyLabel="No process steps yet"
          onAdd={() =>
            setSteps((rows) => [
              ...rows,
              {
                id: `tmp-${Date.now()}`,
                step: "",
                action: "",
                fee: "",
                time: "",
                person: "",
                isActive: true,
                sortOrder: rows.length,
              },
            ])
          }
          onSave={() =>
            onSaveSteps(
              steps.map((row) => ({
                step: row.step,
                action: row.action,
                fee: row.fee,
                time: row.time,
                person: row.person,
                isActive: row.isActive,
              }))
            )
          }
        >
          {steps.map((row, index) => (
            <div key={row.id} className="space-y-2 rounded-lg border bg-white p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  placeholder="Client step"
                  value={row.step}
                  onChange={(e) =>
                    setSteps((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, step: e.target.value } : item))
                    )
                  }
                />
                <Input
                  placeholder="Agency action"
                  value={row.action}
                  onChange={(e) =>
                    setSteps((rows) =>
                      rows.map((item, i) =>
                        i === index ? { ...item, action: e.target.value } : item
                      )
                    )
                  }
                />
                <Input
                  placeholder="Fee"
                  value={row.fee}
                  onChange={(e) =>
                    setSteps((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, fee: e.target.value } : item))
                    )
                  }
                />
                <Input
                  placeholder="Processing time"
                  value={row.time}
                  onChange={(e) =>
                    setSteps((rows) =>
                      rows.map((item, i) => (i === index ? { ...item, time: e.target.value } : item))
                    )
                  }
                />
                <Input
                  placeholder="Person responsible"
                  value={row.person}
                  onChange={(e) =>
                    setSteps((rows) =>
                      rows.map((item, i) =>
                        i === index ? { ...item, person: e.target.value } : item
                      )
                    )
                  }
                />
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Move step up"
                  title="Move up"
                  onClick={() => setSteps((rows) => moveItem(rows, index, index - 1))}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Move step down"
                  title="Move down"
                  onClick={() => setSteps((rows) => moveItem(rows, index, index + 1))}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
                  aria-label="Remove step"
                  title="Remove"
                  onClick={() => setSteps((rows) => rows.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </RepeatableTable>
      )}

      {tab === "medicines" && (
        <RepeatableTable
          pending={pending}
          emptyLabel="No medicine/supply rows yet"
          onAdd={() =>
            setMedicines((rows) => [
              ...rows,
              {
                id: `tmp-${Date.now()}`,
                name: "",
                preparation: "",
                brand: "",
                price: "",
                isSection: false,
                isActive: true,
                sortOrder: rows.length,
              },
            ])
          }
          onSave={() =>
            onSaveMedicines(
              medicines.map((row) => ({
                name: row.name,
                preparation: row.preparation,
                brand: row.brand,
                price: row.price,
                isSection: row.isSection,
                isActive: row.isActive,
              }))
            )
          }
        >
          {medicines.map((row, index) => (
            <div key={row.id} className="grid gap-2 rounded-lg border bg-white p-3 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.6fr_auto]">
              <Input
                placeholder={row.isSection ? "Section title" : "Name of drug / supply"}
                value={row.name}
                onChange={(e) =>
                  setMedicines((rows) =>
                    rows.map((item, i) => (i === index ? { ...item, name: e.target.value } : item))
                  )
                }
              />
              <Input
                placeholder="Preparation"
                disabled={row.isSection}
                value={row.preparation}
                onChange={(e) =>
                  setMedicines((rows) =>
                    rows.map((item, i) =>
                      i === index ? { ...item, preparation: e.target.value } : item
                    )
                  )
                }
              />
              <Input
                placeholder="Brand"
                disabled={row.isSection}
                value={row.brand}
                onChange={(e) =>
                  setMedicines((rows) =>
                    rows.map((item, i) => (i === index ? { ...item, brand: e.target.value } : item))
                  )
                }
              />
              <Input
                placeholder="Price"
                disabled={row.isSection}
                value={row.price}
                onChange={(e) =>
                  setMedicines((rows) =>
                    rows.map((item, i) => (i === index ? { ...item, price: e.target.value } : item))
                  )
                }
              />
              <div className="flex flex-wrap items-center gap-1">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={row.isSection}
                    onChange={(e) =>
                      setMedicines((rows) =>
                        rows.map((item, i) =>
                          i === index ? { ...item, isSection: e.target.checked } : item
                        )
                      )
                    }
                  />
                  Sec
                </label>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Move medicine up"
                  title="Move up"
                  onClick={() => setMedicines((rows) => moveItem(rows, index, index - 1))}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Move medicine down"
                  title="Move down"
                  onClick={() => setMedicines((rows) => moveItem(rows, index, index + 1))}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
                  aria-label="Remove medicine"
                  title="Remove"
                  onClick={() => setMedicines((rows) => rows.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </RepeatableTable>
      )}
    </div>
  );
}

function RepeatableTable({
  children,
  pending,
  emptyLabel,
  onAdd,
  onSave,
}: {
  children: React.ReactNode;
  pending: boolean;
  emptyLabel: string;
  onAdd: () => void;
  onSave: () => void;
}) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add row
        </Button>
        <Button type="button" size="sm" disabled={pending} onClick={onSave}>
          <Save className="mr-1 h-4 w-4" />
          Save rows
        </Button>
      </div>
      {!hasChildren ? (
        <div className="rounded-lg border border-dashed bg-white p-6 text-center text-sm text-gray-500">
          <FileText className="mx-auto mb-2 h-5 w-5 text-gray-400" />
          {emptyLabel}
        </div>
      ) : (
        <div className="max-h-[55vh] space-y-2 overflow-y-auto">{children}</div>
      )}
    </div>
  );
}
