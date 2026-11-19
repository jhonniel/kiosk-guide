"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { KIOSK_COLORS } from "@/lib/constants";
import { getIcon } from "@/utils/icon-map";
import type { ResourceField } from "@/features/admin/resource-definitions";

export const fieldId = (key: string) => `field-${key}`;

const DOCUMENT_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt";
const IMAGE_TYPES = "image/png,image/jpeg,image/svg+xml,image/webp";
const MB = 1024 * 1024;

export const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-white px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

export type UploadedDocument = { fileUrl: string; fileName: string; fileSize: string };

/** Sends one file to an admin upload endpoint and returns its JSON reply, or throws a readable message. */
async function uploadTo(url: string, file: File, extra: Record<string, string> = {}) {
  const body = new FormData();
  body.append("file", file);
  for (const [key, value] of Object.entries(extra)) body.append(key, value);
  const res = await fetch(url, { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.error ?? (res.status === 413 ? "The file is too large to upload." : "The upload failed. Please try again.")
    );
  }
  return data;
}

function FieldShell({
  field,
  error,
  children,
  boxed,
}: {
  field: ResourceField;
  error?: string;
  children: React.ReactNode;
  boxed?: boolean;
}) {
  const id = fieldId(field.key);
  return (
    <div
      className={cn(
        "space-y-1.5",
        boxed && "rounded-lg border bg-gray-50 p-4",
        boxed && error && "border-destructive",
        !field.half && "sm:col-span-2"
      )}
    >
      <Label htmlFor={id}>
        {field.label}
        {field.required ? (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : field.description ? (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          {field.description}
        </p>
      ) : null}
    </div>
  );
}

interface FormFieldProps {
  field: ResourceField;
  value: unknown;
  error?: string;
  /** Values other records already use for this field, offered as suggestions. */
  suggestions?: string[];
  /** The uploaded document currently attached (Downloads). */
  document?: UploadedDocument;
  uploadSlug?: string;
  disabled?: boolean;
  onChange: (value: unknown) => void;
  onDocumentUploaded?: (uploaded: UploadedDocument) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export function FormField({
  field,
  value,
  error,
  suggestions,
  document,
  uploadSlug,
  disabled,
  onChange,
  onDocumentUploaded,
  onUploadingChange,
}: FormFieldProps) {
  const [uploading, setUploading] = useState(false);
  const id = fieldId(field.key);
  const described = error ? `${id}-error` : field.description ? `${id}-hint` : undefined;
  const common = {
    id,
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described,
  };

  async function runUpload(input: HTMLInputElement, maxMb: number, upload: (file: File) => Promise<void>) {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > maxMb * MB) {
      toast.error(`That file is too large. The limit is ${maxMb} MB.`);
      input.value = "";
      return;
    }
    setUploading(true);
    onUploadingChange?.(true);
    try {
      await upload(file);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The upload failed. Please try again.");
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      input.value = "";
    }
  }

  const uploadButton = (label: string, accept: string, onPick: (input: HTMLInputElement) => void) => (
    <>
      <label
        htmlFor={id}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-lg bg-kiosk-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-kiosk-navy/90",
          "focus-within:ring-3 focus-within:ring-ring/50",
          (uploading || disabled) && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Uploading…" : label}
        <input
          {...common}
          type="file"
          className="sr-only"
          accept={accept}
          disabled={uploading || disabled}
          onChange={(e) => onPick(e.target)}
        />
      </label>
    </>
  );

  if (field.type === "image") {
    const currentUrl = String(value ?? "");
    const isCardIcon = field.imageFolder === "homepage-cards";
    return (
      <FieldShell field={field} error={error} boxed>
        <div className="flex flex-wrap items-center gap-4">
          {currentUrl ? (
            <div
              className={cn(
                "relative shrink-0 overflow-hidden rounded-xl border bg-white",
                isCardIcon ? "h-20 w-20" : "h-24 w-36"
              )}
            >
              <Image
                src={currentUrl}
                alt=""
                fill
                className={isCardIcon ? "object-contain p-2" : "object-cover"}
                unoptimized
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No picture yet.</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {uploadButton(currentUrl ? "Replace picture" : "Upload picture", IMAGE_TYPES, (input) =>
              runUpload(input, isCardIcon ? 2 : 5, async (file) => {
                const data = isCardIcon
                  ? await uploadTo("/api/admin/files/upload-homepage-icon", file, uploadSlug ? { slug: uploadSlug } : {})
                  : await uploadTo("/api/admin/files/upload-image", file, { folder: field.imageFolder ?? "" });
                onChange(data.fileUrl);
                toast.success("Picture uploaded. Save to keep it.");
              })
            )}
            {currentUrl ? (
              <Button type="button" variant="outline" disabled={uploading || disabled} onClick={() => onChange("")}>
                <Trash2 />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </FieldShell>
    );
  }

  if (field.type === "file") {
    return (
      <FieldShell field={field} error={error} boxed>
        {document?.fileUrl ? (
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-2 text-sm text-kiosk-navy underline-offset-2 hover:underline"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{document.fileName || "Open the current file"}</span>
            {document.fileSize ? <span className="shrink-0 text-gray-500">({document.fileSize})</span> : null}
          </a>
        ) : (
          <p className="text-sm text-gray-500">No file uploaded yet.</p>
        )}
        <div>
          {uploadButton(document?.fileUrl ? "Replace file" : "Upload file", DOCUMENT_TYPES, (input) =>
            runUpload(input, 25, async (file) => {
              const data = await uploadTo("/api/admin/files/upload", file);
              onDocumentUploaded?.({ fileUrl: data.fileUrl, fileName: data.fileName, fileSize: data.fileSize });
              toast.success("File uploaded. Save to keep it.");
            })
          )}
        </div>
      </FieldShell>
    );
  }

  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5 sm:col-span-2">
        <Label htmlFor={id}>{field.label}</Label>
        <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} disabled={disabled} />
      </div>
    );
  }

  if (field.type === "select") {
    const current = String(value ?? "");
    const PreviewIcon = field.key === "icon" && current ? getIcon(current) : null;
    const swatch =
      field.key === "color" && current in KIOSK_COLORS.card
        ? KIOSK_COLORS.card[current as keyof typeof KIOSK_COLORS.card]
        : null;
    return (
      <FieldShell field={field} error={error}>
        <div className="flex items-center gap-2">
          <select {...common} className={selectClassName} value={current} onChange={(e) => onChange(e.target.value)}>
            <option value="">{field.required ? "Choose…" : "None"}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {PreviewIcon ? (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-white text-kiosk-navy">
              <PreviewIcon className="h-4 w-4" />
            </span>
          ) : null}
          {swatch ? (
            <span
              className="size-8 shrink-0 rounded-lg border"
              style={{ backgroundColor: swatch.icon }}
              aria-hidden="true"
            />
          ) : null}
        </div>
      </FieldShell>
    );
  }

  if (field.type === "textarea" || field.type === "lines") {
    return (
      <FieldShell field={field} error={error}>
        <Textarea
          {...common}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          rows={field.type === "lines" ? 4 : 3}
          placeholder={field.placeholder}
        />
      </FieldShell>
    );
  }

  const listId = suggestions?.length ? `${id}-suggestions` : undefined;
  return (
    <FieldShell field={field} error={error}>
      <Input
        {...common}
        type={field.type === "number" ? "number" : field.type === "date" ? "datetime-local" : "text"}
        step={field.type === "number" ? 1 : undefined}
        list={listId}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        autoComplete="off"
      />
      {listId ? (
        <datalist id={listId}>
          {suggestions?.map((option) => <option key={option} value={option} />)}
        </datalist>
      ) : null}
    </FieldShell>
  );
}
