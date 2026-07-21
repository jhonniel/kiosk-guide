"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  initialDraft: CharterEditionView;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function CitizensCharterAdminClient({ initialDraft }: Props) {
  const [edition, setEdition] = useState(initialDraft);
  const [selectedOfficeId, setSelectedOfficeId] = useState(
    initialDraft.offices[0]?.id ?? null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialDraft.offices[0]?.categories[0]?.id ?? null
  );
  const [selectedServiceId, setSelectedServiceId] = useState(
    initialDraft.offices[0]?.categories[0]?.services[0]?.id ?? null
  );
  const [tab, setTab] = useState<TabKey>("general");
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const selectedOffice = useMemo(
    () => edition.offices.find((office) => office.id === selectedOfficeId) ?? null,
    [edition.offices, selectedOfficeId]
  );
  const selectedCategory = useMemo(
    () =>
      selectedOffice?.categories.find((category) => category.id === selectedCategoryId) ??
      null,
    [selectedCategoryId, selectedOffice]
  );
  const selectedService = useMemo(
    () =>
      selectedCategory?.services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedCategory, selectedServiceId]
  );

  function run(action: () => Promise<unknown>, success: string, reload = true) {
    startTransition(async () => {
      try {
        await action();
        toast.success(success);
        if (reload) window.location.reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Action failed");
      }
    });
  }

  async function handlePdfUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/files/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setEdition((current) => ({
        ...current,
        pdfUrl: data.fileUrl ?? data.url ?? current.pdfUrl,
        pdfFileName: data.fileName ?? file.name,
      }));
      toast.success("PDF uploaded. Save edition settings to keep it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-kiosk-navy">Citizens&apos; Charter</h1>
          <p className="mt-1 text-sm text-gray-600">
            Edit the draft edition, then publish to update the kiosk atomically.
          </p>
          <p className="mt-2 text-xs font-medium text-amber-700">
            Draft · {edition.serviceCount} services · status {edition.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/citizens-charter"
            target="_blank"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-white px-4 text-sm font-medium shadow-sm hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
            Preview published
          </Link>
          <Button
            disabled={pending}
            className="bg-kiosk-green hover:bg-kiosk-green/90"
            onClick={() =>
              run(
                () => publishCharterDraft(edition.id),
                "Draft published to kiosk"
              )
            }
          >
            Publish draft
          </Button>
        </div>
      </div>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold tracking-wide text-kiosk-navy uppercase">
          Edition settings
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input
              value={edition.title}
              onChange={(e) => setEdition({ ...edition, title: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Edition label</Label>
            <Input
              value={edition.editionLabel}
              onChange={(e) => setEdition({ ...edition, editionLabel: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              value={edition.year}
              onChange={(e) => setEdition({ ...edition, year: Number(e.target.value) || edition.year })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>PDF file name</Label>
            <Input
              value={edition.pdfFileName}
              onChange={(e) => setEdition({ ...edition, pdfFileName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={edition.description}
              onChange={(e) => setEdition({ ...edition, description: e.target.value })}
              className="mt-1"
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
            <Label>PDF URL</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              <Input
                value={edition.pdfUrl}
                onChange={(e) => setEdition({ ...edition, pdfUrl: e.target.value })}
                className="flex-1"
              />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload PDF"}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handlePdfUpload(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
        <Button
          className="mt-4"
          disabled={pending}
          onClick={() =>
            run(
              () =>
                updateCharterEditionSettings({
                  editionId: edition.id,
                  title: edition.title,
                  year: edition.year,
                  editionLabel: edition.editionLabel,
                  description: edition.description,
                  pdfUrl: edition.pdfUrl,
                  pdfFileName: edition.pdfFileName,
                }),
              "Edition settings saved",
              false
            )
          }
        >
          <Save className="mr-2 h-4 w-4" />
          Save edition settings
        </Button>
      </section>

      <div className="grid gap-4 xl:grid-cols-[280px_280px_minmax(0,1fr)]">
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-kiosk-navy uppercase">Offices</h2>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => {
                const name = window.prompt("Office name");
                if (!name?.trim()) return;
                run(
                  () => upsertCharterOffice({ editionId: edition.id, name: name.trim() }),
                  "Office added"
                );
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
            {edition.offices.map((office, index) => (
              <li key={office.id} className="rounded-lg border border-transparent hover:border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOfficeId(office.id);
                    setSelectedCategoryId(office.categories[0]?.id ?? null);
                    setSelectedServiceId(office.categories[0]?.services[0]?.id ?? null);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selectedOfficeId === office.id ? "bg-kiosk-navy text-white" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="block font-medium">{office.name}</span>
                  <span className={`text-[11px] ${selectedOfficeId === office.id ? "text-white/70" : "text-gray-500"}`}>
                    {office.categories.reduce((n, c) => n + c.services.length, 0)} services
                    {!office.isActive ? " · hidden" : ""}
                  </span>
                </button>
                <div className="flex gap-1 px-2 pb-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
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
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
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
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
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
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-600"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm(`Delete office “${office.name}”?`)) return;
                      run(() => deleteCharterOffice(office.id), "Office deleted");
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
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
                const name = window.prompt("Category name", "External Services");
                if (!name?.trim()) return;
                run(
                  () =>
                    upsertCharterCategory({
                      officeId: selectedOffice.id,
                      name: name.trim(),
                    }),
                  "Category added"
                );
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {!selectedOffice ? (
            <p className="text-sm text-gray-500">Select an office</p>
          ) : (
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
              {selectedOffice.categories.map((category, index) => (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setSelectedServiceId(category.services[0]?.id ?? null);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      selectedCategoryId === category.id
                        ? "bg-emerald-600 text-white"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="block font-medium">{category.name}</span>
                    <span
                      className={`text-[11px] ${
                        selectedCategoryId === category.id ? "text-white/70" : "text-gray-500"
                      }`}
                    >
                      {category.services.length} services
                    </span>
                  </button>
                  <div className="flex gap-1 px-2 pb-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={pending || index === 0}
                      onClick={() =>
                        run(
                          () =>
                            reorderCharterCategories(
                              selectedOffice.id,
                              moveItem(selectedOffice.categories, index, index - 1).map(
                                (item) => item.id
                              )
                            ),
                          "Category order updated"
                        )
                      }
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={pending || index === selectedOffice.categories.length - 1}
                      onClick={() =>
                        run(
                          () =>
                            reorderCharterCategories(
                              selectedOffice.id,
                              moveItem(selectedOffice.categories, index, index + 1).map(
                                (item) => item.id
                              )
                            ),
                          "Category order updated"
                        )
                      }
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-600"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm(`Delete category “${category.name}”?`)) return;
                        run(() => deleteCharterCategory(category.id), "Category deleted");
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-kiosk-navy uppercase">Services</h2>
            <Button
              size="sm"
              variant="outline"
              disabled={pending || !selectedCategory}
              onClick={() => {
                if (!selectedCategory) return;
                const name = window.prompt("Service name");
                if (!name?.trim()) return;
                run(
                  () =>
                    upsertCharterService({
                      categoryId: selectedCategory.id,
                      name: name.trim(),
                    }),
                  "Service added"
                );
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>

          {!selectedCategory ? (
            <p className="text-sm text-gray-500">Select a category</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
              <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
                {selectedCategory.services.map((service, index) => (
                  <li key={service.id} className="rounded-lg border">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedServiceId(service.id);
                        setTab("general");
                      }}
                      className={`w-full px-3 py-2 text-left text-sm ${
                        selectedServiceId === service.id ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="block font-medium text-kiosk-navy">{service.name}</span>
                      <span className="text-[11px] text-gray-500">
                        {service.pageNumber != null ? `p. ${service.pageNumber}` : "no page"}
                        {!service.isActive ? " · hidden" : ""}
                      </span>
                    </button>
                    <div className="flex flex-wrap gap-1 px-2 pb-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={pending || index === 0}
                        onClick={() =>
                          run(
                            () =>
                              reorderCharterServices(
                                selectedCategory.id,
                                moveItem(selectedCategory.services, index, index - 1).map(
                                  (item) => item.id
                                )
                              ),
                            "Service order updated"
                          )
                        }
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={pending || index === selectedCategory.services.length - 1}
                        onClick={() =>
                          run(
                            () =>
                              reorderCharterServices(
                                selectedCategory.id,
                                moveItem(selectedCategory.services, index, index + 1).map(
                                  (item) => item.id
                                )
                              ),
                            "Service order updated"
                          )
                        }
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={pending}
                        onClick={() =>
                          run(() => duplicateCharterService(service.id), "Service duplicated")
                        }
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm(`Delete service “${service.name}”?`)) return;
                          run(() => deleteCharterService(service.id), "Service deleted");
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              {selectedService ? (
                <ServiceEditor
                  key={selectedService.id}
                  service={selectedService}
                  pending={pending}
                  tab={tab}
                  onTabChange={setTab}
                  onSaveGeneral={(payload) =>
                    run(
                      () =>
                        upsertCharterService({
                          categoryId: selectedCategory.id,
                          id: selectedService.id,
                          ...payload,
                        }),
                      "Service saved"
                    )
                  }
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
                  Select a service to edit
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
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
                  onClick={() => setRequirements((rows) => moveItem(rows, index, index - 1))}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setRequirements((rows) => moveItem(rows, index, index + 1))}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
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
                  onClick={() => setSteps((rows) => moveItem(rows, index, index - 1))}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setSteps((rows) => moveItem(rows, index, index + 1))}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
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
                  onClick={() => setMedicines((rows) => moveItem(rows, index, index - 1))}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setMedicines((rows) => moveItem(rows, index, index + 1))}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
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
