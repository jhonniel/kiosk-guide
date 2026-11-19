"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { SETTING_GROUPS } from "@/features/admin/settings-definitions";
import {
  RESOURCE_CONFIGS,
  type ResourceKey,
} from "@/features/admin/resource-definitions";
import { RESOURCE_PERMISSION } from "@/features/admin/permissions";
import {
  AdminInputError,
  linesToList,
  parseManilaDateTime,
  validateResourceValues,
} from "@/features/admin/resource-validation";

async function requireResourcePermission(resource: ResourceKey) {
  const permission = RESOURCE_PERMISSION[resource];
  if (!permission) throw new Error("Forbidden");
  await requirePermission(permission);
}

type ActionResult = { success: true } | { success: false; error: string };

/** Turns a failure into a message an admin can act on; unexpected ones are logged, not shown. */
function describeError(e: unknown, fallback: string, resource?: ResourceKey): string {
  if (e instanceof AdminInputError) return e.message;
  if (e instanceof Error && e.message === "Unauthorized") return "Your session has ended. Sign in again.";
  if (e instanceof Error && e.message === "Forbidden") return "You do not have permission to do this.";

  const code = (e as { code?: unknown } | null)?.code;
  if (code === "P2002") {
    const target = (e as { meta?: { target?: unknown } }).meta?.target;
    const key = Array.isArray(target) ? String(target[0]) : "";
    const field = resource ? RESOURCE_CONFIGS[resource].fields.find((f) => f.key === key) : undefined;
    return field
      ? `Another record already uses this ${field.label.toLowerCase()}. Choose a different one.`
      : "Another record already uses the same value. Choose a different one.";
  }
  if (code === "P2025") return "This record no longer exists. Refresh the page and try again.";

  console.error(`[admin] ${fallback}`, e);
  return fallback;
}

function parseFieldValue(value: unknown, type: string): unknown {
  if (type === "boolean") return value === true || value === "true" || value === "1";
  if (type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (type === "date") return parseManilaDateTime(value);
  if (type === "lines") return JSON.stringify(linesToList(value));
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function coerceRecord(
  data: Record<string, unknown>,
  resource: ResourceKey,
  mode: "create" | "update"
): Record<string, unknown> {
  const config = RESOURCE_CONFIGS[resource];

  const problems = Object.values(validateResourceValues(config, data, { onlyPresent: mode === "update" }));
  if (problems.length > 0) throw new AdminInputError(problems[0]);

  const result: Record<string, unknown> = {};

  for (const field of config.fields) {
    if (field.type === "file" || !(field.key in data)) continue;
    result[field.key] = parseFieldValue(data[field.key], field.type);
  }

  // The document upload field ("fileAsset") stores its result in these columns.
  if (resource === "downloads") {
    for (const key of ["fileUrl", "fileName", "fileSize"] as const) {
      if (key in data) result[key] = String(data[key] ?? "");
    }
  }

  return result;
}

/** A download switched off for a broken file comes back on only with a newly uploaded file. */
async function downloadUpdateData(
  id: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const current = await db.download.findUnique({
    where: { id },
    select: { fileUrl: true, fileProblem: true },
  });
  if (!current) throw new AdminInputError("This document no longer exists. Refresh the page and try again.");
  if (!current.fileProblem) return payload;

  const replacedFile = typeof payload.fileUrl === "string" && payload.fileUrl !== "" && payload.fileUrl !== current.fileUrl;
  if (replacedFile) {
    return { ...payload, isActive: true, fileProblem: null, fileProblemAt: null };
  }
  if (payload.isActive === true) {
    throw new AdminInputError(
      `This document was turned off because its file is broken (${current.fileProblem}) Upload a working file to turn it back on.`
    );
  }
  return payload;
}

export async function updateSettings(
  values: Record<string, string>
): Promise<ActionResult> {
  try {
    await requirePermission("manage_settings");

    const allowedKeys = new Set(
      SETTING_GROUPS.flatMap((g) => g.fields.map((f) => f.key))
    );

    for (const [key, value] of Object.entries(values)) {
      if (!allowedKeys.has(key)) continue;
      const group = SETTING_GROUPS.find((g) => g.fields.some((f) => f.key === key))?.id;
      await db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value, group },
      });
    }

    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");
    revalidatePath("/building-directory");
    revalidatePath("/download-center");
    revalidatePath("/api/kiosk/offline-data");

    try {
      const { writeFileSync, mkdirSync } = await import("fs");
      const { exportCitizensCharterOfflineData, exportKioskOfflineData } = await import(
        "@/features/offline/export-kiosk-data"
      );
      const { getKioskPrecacheRoutes } = await import("@/features/offline/selectors");
      const [data, charter] = await Promise.all([
        exportKioskOfflineData(),
        exportCitizensCharterOfflineData(),
      ]);
      mkdirSync("public", { recursive: true });
      writeFileSync("public/kiosk-offline-data.json", JSON.stringify(data, null, 0));
      writeFileSync("public/kiosk-citizens-charter.json", JSON.stringify(charter, null, 0));
      const routes = [
        ...getKioskPrecacheRoutes(data),
        "/kiosk-citizens-charter.json",
        "/kiosk-offline-data.json",
      ];
      writeFileSync("public/kiosk-precache-routes.json", JSON.stringify([...new Set(routes)]));
    } catch {
      // Settings still saved even if offline bundle refresh fails.
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: describeError(e, "The settings could not be saved. Please try again.") };
  }
}

export async function createResource(
  resource: ResourceKey,
  data: Record<string, unknown>
): Promise<ActionResult & { id?: string }> {
  try {
    await requireResourcePermission(resource);
    const payload = coerceRecord(data, resource, "create");

    let created: { id: string };
    switch (resource) {
      case "services":
        created = await db.service.create({ data: payload as never });
        break;
      case "directories":
        created = await db.directory.create({ data: payload as never });
        break;
      case "downloads":
        created = await db.download.create({ data: payload as never });
        break;
      case "announcements":
        created = await db.announcement.create({
          data: { ...(payload as object), publishedAt: new Date() } as never,
        });
        break;
      case "faqs":
        created = await db.faq.create({ data: payload as never });
        break;
      case "events":
        created = await db.event.create({ data: payload as never });
        break;
      case "emergency":
        created = await db.emergencyContact.create({ data: payload as never });
        break;
      case "tourism":
        created = await db.tourism.create({ data: payload as never });
        break;
      case "quickLinks":
        created = await db.quickLink.create({ data: payload as never });
        break;
      case "homepageCards":
        created = await db.homepageCard.create({ data: payload as never });
        break;
      case "buildingLocations":
        created = await db.buildingLocation.create({
          data: {
            nearbyLandmarks: "[]",
            directionsEn: "[]",
            ...payload,
          } as never,
        });
        break;
      default:
        return { success: false, error: "Unknown resource" };
    }

    revalidateAdminResource(resource);
    return { success: true, id: created.id };
  } catch (e) {
    return { success: false, error: describeError(e, "The record could not be saved. Please try again.", resource) };
  }
}

export async function updateResource(
  resource: ResourceKey,
  id: string,
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    await requireResourcePermission(resource);
    const payload = coerceRecord(data, resource, "update");

    switch (resource) {
      case "services":
        await db.service.update({ where: { id }, data: payload as never });
        break;
      case "directories":
        await db.directory.update({ where: { id }, data: payload as never });
        break;
      case "downloads":
        await db.download.update({ where: { id }, data: (await downloadUpdateData(id, payload)) as never });
        break;
      case "announcements":
        await db.announcement.update({ where: { id }, data: payload as never });
        break;
      case "faqs":
        await db.faq.update({ where: { id }, data: payload as never });
        break;
      case "events":
        await db.event.update({ where: { id }, data: payload as never });
        break;
      case "emergency":
        await db.emergencyContact.update({ where: { id }, data: payload as never });
        break;
      case "tourism":
        await db.tourism.update({ where: { id }, data: payload as never });
        break;
      case "quickLinks":
        await db.quickLink.update({ where: { id }, data: payload as never });
        break;
      case "homepageCards":
        await db.homepageCard.update({ where: { id }, data: payload as never });
        break;
      case "buildingLocations":
        await db.buildingLocation.update({ where: { id }, data: payload as never });
        break;
      default:
        return { success: false, error: "Unknown resource" };
    }

    revalidateAdminResource(resource);
    return { success: true };
  } catch (e) {
    return { success: false, error: describeError(e, "The changes could not be saved. Please try again.", resource) };
  }
}

export async function deleteResource(resource: ResourceKey, id: string): Promise<ActionResult> {
  try {
    await requireResourcePermission(resource);

    switch (resource) {
      case "services":
        await db.service.delete({ where: { id } });
        break;
      case "directories":
        await db.directory.delete({ where: { id } });
        break;
      case "downloads": {
        // Deleting a document would also erase its delivery history (QR scans, emails sent).
        const deliveries = await db.downloadActivity.count({ where: { downloadId: id } });
        if (deliveries > 0) {
          throw new AdminInputError(
            `This document has ${deliveries} delivery record${deliveries === 1 ? "" : "s"} in the activity history, so it cannot be deleted. Turn off “Show on the kiosk” to hide it instead.`
          );
        }
        await db.download.delete({ where: { id } });
        break;
      }
      case "announcements":
        await db.announcement.delete({ where: { id } });
        break;
      case "faqs":
        await db.faq.delete({ where: { id } });
        break;
      case "events":
        await db.event.delete({ where: { id } });
        break;
      case "emergency":
        await db.emergencyContact.delete({ where: { id } });
        break;
      case "tourism":
        await db.tourism.delete({ where: { id } });
        break;
      case "quickLinks":
        await db.quickLink.delete({ where: { id } });
        break;
      case "homepageCards":
        await db.homepageCard.delete({ where: { id } });
        break;
      case "buildingLocations":
        await db.buildingLocation.delete({ where: { id } });
        break;
      default:
        return { success: false, error: "Unknown resource" };
    }

    revalidateAdminResource(resource);
    return { success: true };
  } catch (e) {
    return { success: false, error: describeError(e, "The record could not be deleted. Please try again.", resource) };
  }
}

/**
 * Copies the kiosk's built-in Capitol room list into the Building Locations table so it can be edited.
 * The built-in ids are kept, because the map routes on the kiosk are tied to them.
 */
export async function importBuiltInBuildingLocations(): Promise<ActionResult & { count?: number }> {
  try {
    await requireResourcePermission("buildingLocations");

    if ((await db.buildingLocation.count()) > 0) {
      throw new AdminInputError("The list already has locations, so the built-in list was not copied.");
    }

    const { CAPITOL_BUILDING_LOCATIONS } = await import("@/features/building-directory/capitol-building");
    const result = await db.buildingLocation.createMany({
      data: CAPITOL_BUILDING_LOCATIONS.map((location, index) => ({
        id: location.id,
        buildingNameEn: location.buildingNameEn,
        buildingNameFil: location.buildingNameFil ?? null,
        buildingNameBis: location.buildingNameBis ?? null,
        nameEn: location.nameEn,
        nameFil: location.nameFil ?? null,
        nameBis: location.nameBis ?? null,
        floor: location.floor,
        floorLabelEn: location.floorLabelEn,
        floorLabelFil: location.floorLabelFil ?? null,
        floorLabelBis: location.floorLabelBis ?? null,
        room: location.room ?? null,
        locationType: location.locationType,
        category: location.category ?? null,
        nearbyLandmarks: JSON.stringify(location.nearbyLandmarks),
        directionsEn: JSON.stringify(location.directionsEn),
        directionsFil: JSON.stringify(location.directionsFil ?? []),
        directionsBis: JSON.stringify(location.directionsBis ?? []),
        aliases: JSON.stringify(location.aliases ?? []),
        sortOrder: index,
      })),
    });

    revalidateAdminResource("buildingLocations");
    return { success: true, count: result.count };
  } catch (e) {
    return {
      success: false,
      error: describeError(e, "The built-in list could not be copied. Please try again.", "buildingLocations"),
    };
  }
}

function revalidateAdminResource(resource: ResourceKey) {
  const paths: Record<ResourceKey, string> = {
    services: "/admin/services",
    directories: "/admin/directories",
    downloads: "/admin/downloads",
    announcements: "/admin/announcements",
    faqs: "/admin/faqs",
    events: "/admin/events",
    emergency: "/admin/emergency",
    tourism: "/admin/tourism",
    quickLinks: "/admin/quick-links",
    homepageCards: "/admin/homepage-cards",
    buildingLocations: "/admin/building-locations",
  };
  revalidatePath(paths[resource]);
  revalidatePath("/", "layout");
  revalidatePath("/building-directory");
  revalidatePath("/download-center");
}
