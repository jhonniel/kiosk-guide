"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { SETTING_GROUPS } from "@/features/admin/settings-definitions";
import {
  RESOURCE_CONFIGS,
  type ResourceKey,
} from "@/features/admin/resource-definitions";

type ActionResult = { success: true } | { success: false; error: string };

function parseFieldValue(value: unknown, type: string): unknown {
  if (type === "boolean") return value === true || value === "true" || value === "1";
  if (type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (type === "date") {
    if (!value) return null;
    return new Date(String(value));
  }
  if (value === null || value === undefined) return type === "json" ? "[]" : "";
  return String(value);
}

function coerceRecord(
  data: Record<string, unknown>,
  resource: ResourceKey
): Record<string, unknown> {
  const config = RESOURCE_CONFIGS[resource];
  const result: Record<string, unknown> = {};

  for (const field of config.fields) {
    if (!(field.key in data)) continue;
    result[field.key] = parseFieldValue(data[field.key], field.type);
  }

  return result;
}

export async function updateSettings(
  values: Record<string, string>
): Promise<ActionResult> {
  try {
    await requireAdmin();

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
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save settings" };
  }
}

export async function createResource(
  resource: ResourceKey,
  data: Record<string, unknown>
): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
    const payload = coerceRecord(data, resource);

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
    return { success: false, error: e instanceof Error ? e.message : "Failed to create record" };
  }
}

export async function updateResource(
  resource: ResourceKey,
  id: string,
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const payload = coerceRecord(data, resource);

    switch (resource) {
      case "services":
        await db.service.update({ where: { id }, data: payload as never });
        break;
      case "directories":
        await db.directory.update({ where: { id }, data: payload as never });
        break;
      case "downloads":
        await db.download.update({ where: { id }, data: payload as never });
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
    return { success: false, error: e instanceof Error ? e.message : "Failed to update record" };
  }
}

export async function deleteResource(resource: ResourceKey, id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    switch (resource) {
      case "services":
        await db.service.delete({ where: { id } });
        break;
      case "directories":
        await db.directory.delete({ where: { id } });
        break;
      case "downloads":
        await db.download.delete({ where: { id } });
        break;
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
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete record" };
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
