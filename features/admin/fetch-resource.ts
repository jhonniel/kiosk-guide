import { db } from "@/lib/db";
import type { ResourceKey } from "./resource-definitions";

export async function fetchAdminResource(resource: ResourceKey) {
  switch (resource) {
    case "services":
      return db.service.findMany({ orderBy: { sortOrder: "asc" } });
    case "directories":
      return db.directory.findMany({ orderBy: { sortOrder: "asc" } });
    case "downloads":
      return db.download.findMany({ orderBy: { sortOrder: "asc" } });
    case "announcements":
      return db.announcement.findMany({ orderBy: { publishedAt: "desc" } });
    case "faqs":
      return db.faq.findMany({ orderBy: { sortOrder: "asc" } });
    case "events":
      return db.event.findMany({ orderBy: { startDate: "asc" } });
    case "emergency":
      return db.emergencyContact.findMany({ orderBy: { sortOrder: "asc" } });
    case "tourism":
      return db.tourism.findMany({ orderBy: { sortOrder: "asc" } });
    case "quickLinks":
      return db.quickLink.findMany({ orderBy: { sortOrder: "asc" } });
    case "homepageCards":
      return db.homepageCard.findMany({ orderBy: { sortOrder: "asc" } });
    case "buildingLocations":
      return db.buildingLocation.findMany({
        orderBy: [{ floor: "asc" }, { sortOrder: "asc" }],
      });
    default:
      return [];
  }
}

export function serializeResourceRow(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = { id: String(row.id) };
  for (const [key, value] of Object.entries(row)) {
    if (key === "id") continue;
    if (value === null || value === undefined) {
      out[key] = "";
    } else if (value instanceof Date) {
      out[key] = value.toISOString().slice(0, 16);
    } else if (typeof value === "boolean") {
      out[key] = value ? "Yes" : "No";
    } else {
      out[key] = String(value);
    }
  }
  return out;
}

export function deserializeResourceRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const [key, value] of Object.entries(out)) {
    if (value === "Yes") out[key] = true;
    else if (value === "No") out[key] = false;
  }
  return out;
}
