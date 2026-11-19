import type { ResourceConfig } from "./resource-definitions";

/** A problem the admin can fix; its message is safe to show as-is. */
export class AdminInputError extends Error {}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LINK_PATTERN = /^(\/\S*|https?:\/\/\S+)$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

/** "2026-12-25T09:30" typed in the form means 9:30 AM Philippine time, wherever the server or browser is. */
export function parseManilaDateTime(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(LOCAL_DATE_TIME.test(text) ? `${text}:00+08:00` : text);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Value for a `datetime-local` input showing Philippine time. */
export function toManilaInputValue(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + MANILA_OFFSET_MS).toISOString().slice(0, 16);
}

/** Turns the one-per-line text of a `lines` field (or an already stored JSON array) into a list. */
export function linesToList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  const text = String(value ?? "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      // Not JSON after all; treat it as plain lines.
    }
  }
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Text for editing a stored JSON array one item per line. */
export function listToLines(value: unknown): string {
  return linesToList(value).join("\n");
}

/**
 * Checks form values against the resource's field rules.
 * Returns a message per field key; an empty object means the values can be saved.
 * With `onlyPresent`, fields missing from `values` are skipped (partial updates).
 */
export function validateResourceValues(
  config: ResourceConfig,
  values: Record<string, unknown>,
  options: { onlyPresent?: boolean } = {}
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of config.fields) {
    if (field.type === "boolean") continue;
    const sourceKey = field.type === "file" ? "fileUrl" : field.key;
    if (options.onlyPresent && !(sourceKey in values)) continue;

    const raw = values[sourceKey];
    const text = raw === null || raw === undefined ? "" : String(raw).trim();

    if (!text || (field.type === "lines" && linesToList(raw).length === 0)) {
      if (!field.required) continue;
      if (field.type === "file") errors[field.key] = "Upload a document file.";
      else if (field.type === "select") errors[field.key] = `Choose an option for “${field.label}”.`;
      else errors[field.key] = `${field.label} is required.`;
      continue;
    }

    if (field.type === "number" && !Number.isInteger(Number(text))) {
      errors[field.key] = `${field.label} must be a whole number.`;
    } else if (field.type === "date" && !parseManilaDateTime(raw)) {
      errors[field.key] = `${field.label} is not a valid date and time.`;
    } else if (field.type === "select" && !field.options?.some((option) => option.value === text)) {
      errors[field.key] = `Choose one of the listed options for “${field.label}”.`;
    } else if (field.format === "slug" && !SLUG_PATTERN.test(text)) {
      errors[field.key] = "Use lowercase letters, numbers and dashes only, for example business-permit.";
    } else if (field.format === "link" && !LINK_PATTERN.test(text)) {
      errors[field.key] = "Enter a kiosk page starting with a slash, for example /services/business-permit.";
    } else if (field.format === "email" && !EMAIL_PATTERN.test(text)) {
      errors[field.key] = "Enter a valid email address.";
    }
  }

  const start = parseManilaDateTime(values.startDate);
  const end = parseManilaDateTime(values.endDate);
  if (start && end && !errors.startDate && !errors.endDate && end.getTime() < start.getTime()) {
    errors.endDate = "The end cannot be earlier than the start.";
  }

  return errors;
}

/** Suggests a page address name from a title: "Business Permit (New)" becomes "business-permit-new". */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
