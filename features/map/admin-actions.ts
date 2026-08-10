"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { mapPercentToLatLng } from "@/data/map/geometry";
import { ATTRACTION_GEO } from "@/data/map/attraction-geo";
import { CAMIGUIN_ATTRACTIONS } from "@/features/map/attractions";

import type {
  MapAttractionWriteInput,
  MapAnnotationWriteInput,
  MapRouteWriteInput,
  MapPlaceWriteInput,
  MapCategoryWriteInput,
  MapMunicipalityWriteInput,
} from "@/features/map/admin-types";


type ActionResult = { success: true } | { success: false; error: string };

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function revalidateMapAdmin() {
  revalidatePath("/admin/map");
  revalidatePath("/map");
  revalidatePath("/", "layout");
  revalidatePath("/api/kiosk/offline-data");
}

function parsePoints(pointsJson: string): Array<{ x: number; y: number }> {
  try {
    const pts = JSON.parse(pointsJson) as Array<{ x: number; y: number }>;
    return Array.isArray(pts) ? pts : [];
  } catch {
    return [];
  }
}

function attractionWriteData(data: MapAttractionWriteInput, nameEn: string) {
  return {
    nameEn,
    nameFil: data.nameFil?.trim() || nameEn,
    nameBis: data.nameBis?.trim() || data.nameFil?.trim() || nameEn,
    descriptionEn: data.descriptionEn?.trim() || nameEn,
    descriptionFil: data.descriptionFil?.trim() || data.descriptionEn?.trim() || nameEn,
    descriptionBis:
      data.descriptionBis?.trim() ||
      data.descriptionFil?.trim() ||
      data.descriptionEn?.trim() ||
      nameEn,
    historyEn: data.historyEn?.trim() || null,
    historyFil: data.historyFil?.trim() || null,
    historyBis: data.historyBis?.trim() || null,
    categoryId: data.categoryId,
    municipalityId: data.municipalityId || null,
    coverImage: data.coverImage?.trim() || null,
    entranceFeeEn: data.entranceFeeEn?.trim() || null,
    entranceFeeFil: data.entranceFeeFil?.trim() || null,
    entranceFeeBis: data.entranceFeeBis?.trim() || null,
    openingHoursEn: data.openingHoursEn?.trim() || null,
    openingHoursFil: data.openingHoursFil?.trim() || null,
    openingHoursBis: data.openingHoursBis?.trim() || null,
    travelTipsEn: data.travelTipsEn?.trim() || null,
    travelTipsFil: data.travelTipsFil?.trim() || null,
    travelTipsBis: data.travelTipsBis?.trim() || null,
    travelTimeEn: data.travelTimeEn?.trim() || null,
    travelTimeFil: data.travelTimeFil?.trim() || null,
    travelTimeBis: data.travelTimeBis?.trim() || null,
    distanceFromCapitolEn: data.distanceFromCapitolEn?.trim() || null,
    distanceFromCapitolFil: data.distanceFromCapitolFil?.trim() || null,
    distanceFromCapitolBis: data.distanceFromCapitolBis?.trim() || null,
    phone: data.phone?.trim() || null,
    website: data.website?.trim() || null,
    rating:
      typeof data.rating === "number" && Number.isFinite(data.rating) ? data.rating : 4.5,
    labelText: data.labelText?.trim() || null,
    labelDx: typeof data.labelDx === "number" ? data.labelDx : null,
    labelDy: typeof data.labelDy === "number" ? data.labelDy : null,
    labelSide: data.labelSide?.trim() || null,
    featured: Boolean(data.featured),
    isActive: data.isActive !== false,
  };
}

export async function createMapAttraction(
  data: MapAttractionWriteInput
): Promise<ActionResult & { id?: string }> {
  try {
    await requirePermission("manage_map");
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Name (EN) is required." };
    if (!data.categoryId) return { success: false, error: "Category is required." };

    const category = await db.mapCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) return { success: false, error: "Category not found." };

    let slug = slugify(data.slug?.trim() || nameEn);
    if (!slug) slug = `attraction-${Date.now()}`;
    const existing = await db.mapAttraction.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const mapX = clampPercent(data.mapX ?? 50);
    const mapY = clampPercent(data.mapY ?? 45);
    const { latitude, longitude } = mapPercentToLatLng(mapX, mapY);
    const maxSort = await db.mapAttraction.aggregate({ _max: { sortOrder: true } });
    const sortOrder =
      typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder)
        ? data.sortOrder
        : (maxSort._max.sortOrder ?? 0) + 1;

    const created = await db.mapAttraction.create({
      data: {
        slug,
        ...attractionWriteData(data, nameEn),
        mapX,
        mapY,
        latitude,
        longitude,
        sortOrder,
      },
    });

    revalidateMapAdmin();
    return { success: true, id: created.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create attraction",
    };
  }
}

export async function updateMapAttraction(
  id: string,
  data: MapAttractionWriteInput
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    const existing = await db.mapAttraction.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Attraction not found." };

    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Name (EN) is required." };
    if (!data.categoryId) return { success: false, error: "Category is required." };

    const category = await db.mapCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) return { success: false, error: "Category not found." };

    let slug = existing.slug;
    if (data.slug?.trim()) {
      const nextSlug = slugify(data.slug);
      if (nextSlug && nextSlug !== existing.slug) {
        const clash = await db.mapAttraction.findUnique({ where: { slug: nextSlug } });
        if (clash && clash.id !== id) {
          return { success: false, error: "Slug already in use." };
        }
        slug = nextSlug;
      }
    }

    await db.mapAttraction.update({
      where: { id },
      data: {
        slug,
        ...attractionWriteData(data, nameEn),
        sortOrder:
          typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder)
            ? data.sortOrder
            : existing.sortOrder,
      },
    });

    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update attraction",
    };
  }
}

export async function updateMapAttractionPosition(
  id: string,
  mapX: number,
  mapY: number
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    const x = clampPercent(mapX);
    const y = clampPercent(mapY);
    const { latitude, longitude } = mapPercentToLatLng(x, y);
    await db.mapAttraction.update({
      where: { id },
      data: { mapX: x, mapY: y, latitude, longitude },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update pin position",
    };
  }
}

export async function deleteMapAttraction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    await db.mapAttraction.delete({ where: { id } });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete attraction",
    };
  }
}

export async function resetMapAttractionPosition(
  id: string
): Promise<ActionResult & { mapX?: number; mapY?: number }> {
  try {
    await requirePermission("manage_map");
    const row = await db.mapAttraction.findUnique({ where: { id } });
    if (!row) return { success: false, error: "Attraction not found." };

    const catalog = CAMIGUIN_ATTRACTIONS.find((a) => a.id === row.slug);
    const geo = ATTRACTION_GEO[row.slug as keyof typeof ATTRACTION_GEO];
    if (!catalog && !geo) {
      return { success: false, error: "No default position for this pin." };
    }

    const mapX = clampPercent(geo?.x ?? catalog!.x);
    const mapY = clampPercent(geo?.y ?? catalog!.y);
    const { latitude, longitude } = geo
      ? { latitude: geo.lat, longitude: geo.lng }
      : mapPercentToLatLng(mapX, mapY);

    await db.mapAttraction.update({
      where: { id },
      data: { mapX, mapY, latitude, longitude },
    });

    revalidateMapAdmin();
    return { success: true, mapX, mapY };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to reset pin position",
    };
  }
}

export async function addMapAttractionPhoto(
  attractionId: string,
  url: string,
  caption?: string | null
): Promise<ActionResult & { id?: string }> {
  try {
    await requirePermission("manage_map");
    const maxSort = await db.mapPhoto.aggregate({
      where: { attractionId },
      _max: { sortOrder: true },
    });
    const created = await db.mapPhoto.create({
      data: {
        attractionId,
        url: url.trim(),
        caption: caption?.trim() || null,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
    revalidateMapAdmin();
    return { success: true, id: created.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to add photo",
    };
  }
}

export async function deleteMapAttractionPhoto(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    await db.mapPhoto.delete({ where: { id } });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete photo",
    };
  }
}

/* ---------- Annotations ---------- */

export async function createMapAnnotation(
  data: MapAnnotationWriteInput
): Promise<ActionResult & { id?: string }> {
  try {
    await requirePermission("manage_map");
    const text = data.text?.trim();
    if (!text) return { success: false, error: "Label text is required." };
    let slug = slugify(data.slug?.trim() || text);
    if (!slug) slug = `label-${Date.now()}`;
    const clash = await db.mapAnnotation.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;

    const maxSort = await db.mapAnnotation.aggregate({ _max: { sortOrder: true } });
    const created = await db.mapAnnotation.create({
      data: {
        slug,
        text,
        kind: data.kind || "poi",
        mapX: clampPercent(data.mapX ?? 50),
        mapY: clampPercent(data.mapY ?? 50),
        fontSize: data.fontSize ?? null,
        anchor: data.anchor || null,
        infoEn: data.infoEn?.trim() || null,
        infoFil: data.infoFil?.trim() || null,
        infoBis: data.infoBis?.trim() || null,
        skipIfAttractionSlug: data.skipIfAttractionSlug?.trim() || null,
        isActive: data.isActive !== false,
        sortOrder:
          typeof data.sortOrder === "number"
            ? data.sortOrder
            : (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    revalidateMapAdmin();
    return { success: true, id: created.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create label",
    };
  }
}

export async function updateMapAnnotation(
  id: string,
  data: MapAnnotationWriteInput
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    const existing = await db.mapAnnotation.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Label not found." };
    const text = data.text?.trim();
    if (!text) return { success: false, error: "Label text is required." };

    let slug = existing.slug;
    if (data.slug?.trim()) {
      const next = slugify(data.slug);
      if (next && next !== existing.slug) {
        const clash = await db.mapAnnotation.findUnique({ where: { slug: next } });
        if (clash && clash.id !== id) return { success: false, error: "Slug already in use." };
        slug = next;
      }
    }

    await db.mapAnnotation.update({
      where: { id },
      data: {
        slug,
        text,
        kind: data.kind || existing.kind,
        fontSize: data.fontSize ?? null,
        anchor: data.anchor || null,
        infoEn: data.infoEn?.trim() || null,
        infoFil: data.infoFil?.trim() || null,
        infoBis: data.infoBis?.trim() || null,
        skipIfAttractionSlug: data.skipIfAttractionSlug?.trim() || null,
        isActive: data.isActive !== false,
        sortOrder:
          typeof data.sortOrder === "number" ? data.sortOrder : existing.sortOrder,
      },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update label",
    };
  }
}

export async function updateMapAnnotationPosition(
  id: string,
  mapX: number,
  mapY: number
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    await db.mapAnnotation.update({
      where: { id },
      data: { mapX: clampPercent(mapX), mapY: clampPercent(mapY) },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to move label",
    };
  }
}

export async function deleteMapAnnotation(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    await db.mapAnnotation.delete({ where: { id } });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete label",
    };
  }
}

/* ---------- Routes ---------- */

export async function createMapRoute(
  data: MapRouteWriteInput
): Promise<ActionResult & { id?: string }> {
  try {
    await requirePermission("manage_map");
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Route name is required." };
    if (!data.fromId || !data.toId) {
      return { success: false, error: "From and to attractions are required." };
    }
    if (data.fromId === data.toId) {
      return { success: false, error: "From and to must be different." };
    }

    const [from, to] = await Promise.all([
      db.mapAttraction.findUnique({ where: { id: data.fromId } }),
      db.mapAttraction.findUnique({ where: { id: data.toId } }),
    ]);
    if (!from || !to) return { success: false, error: "Attraction not found." };

    let slug = slugify(data.slug?.trim() || nameEn);
    if (!slug) slug = `route-${Date.now()}`;
    const clash = await db.mapRoute.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;

    const points =
      data.points?.length >= 2
        ? data.points.map((p) => ({ x: clampPercent(p.x), y: clampPercent(p.y) }))
        : [
            { x: from.mapX, y: from.mapY },
            { x: to.mapX, y: to.mapY },
          ];

    const created = await db.mapRoute.create({
      data: {
        slug,
        nameEn,
        nameFil: data.nameFil?.trim() || nameEn,
        nameBis: data.nameBis?.trim() || data.nameFil?.trim() || nameEn,
        kind: data.kind === "boat" ? "boat" : "road",
        fromId: data.fromId,
        toId: data.toId,
        pointsJson: JSON.stringify(points),
        travelTimeEn: data.travelTimeEn?.trim() || null,
        travelTimeFil: data.travelTimeFil?.trim() || null,
        travelTimeBis: data.travelTimeBis?.trim() || null,
        distanceKm:
          typeof data.distanceKm === "number" && Number.isFinite(data.distanceKm)
            ? data.distanceKm
            : null,
        isActive: data.isActive !== false,
      },
    });
    revalidateMapAdmin();
    return { success: true, id: created.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create route",
    };
  }
}

export async function updateMapRoute(
  id: string,
  data: MapRouteWriteInput
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    const existing = await db.mapRoute.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Route not found." };

    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Route name is required." };

    const [from, to] = await Promise.all([
      db.mapAttraction.findUnique({ where: { id: data.fromId } }),
      db.mapAttraction.findUnique({ where: { id: data.toId } }),
    ]);
    if (!from || !to) return { success: false, error: "Attraction not found." };

    let slug = existing.slug;
    if (data.slug?.trim()) {
      const next = slugify(data.slug);
      if (next && next !== existing.slug) {
        const clash = await db.mapRoute.findUnique({ where: { slug: next } });
        if (clash && clash.id !== id) return { success: false, error: "Slug already in use." };
        slug = next;
      }
    }

    const points =
      data.points?.length >= 2
        ? data.points.map((p) => ({ x: clampPercent(p.x), y: clampPercent(p.y) }))
        : parsePoints(existing.pointsJson);

    await db.mapRoute.update({
      where: { id },
      data: {
        slug,
        nameEn,
        nameFil: data.nameFil?.trim() || nameEn,
        nameBis: data.nameBis?.trim() || data.nameFil?.trim() || nameEn,
        kind: data.kind === "boat" ? "boat" : "road",
        fromId: data.fromId,
        toId: data.toId,
        pointsJson: JSON.stringify(points),
        travelTimeEn: data.travelTimeEn?.trim() || null,
        travelTimeFil: data.travelTimeFil?.trim() || null,
        travelTimeBis: data.travelTimeBis?.trim() || null,
        distanceKm:
          typeof data.distanceKm === "number" && Number.isFinite(data.distanceKm)
            ? data.distanceKm
            : null,
        isActive: data.isActive !== false,
      },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update route",
    };
  }
}

export async function deleteMapRoute(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    await db.mapRoute.delete({ where: { id } });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete route",
    };
  }
}

/* ---------- Hotels / Restaurants ---------- */

function placeWriteData(data: MapPlaceWriteInput, nameEn: string) {
  const descriptionEn = data.descriptionEn?.trim() || nameEn;
  return {
    nameEn,
    nameFil: data.nameFil?.trim() || nameEn,
    nameBis: data.nameBis?.trim() || data.nameFil?.trim() || nameEn,
    description: descriptionEn,
    descriptionEn,
    descriptionFil: data.descriptionFil?.trim() || null,
    descriptionBis: data.descriptionBis?.trim() || null,
    coverImage: data.coverImage?.trim() || null,
    phone: data.phone?.trim() || null,
    website: data.website?.trim() || null,
    openingHoursEn: data.openingHoursEn?.trim() || null,
    openingHoursFil: data.openingHoursFil?.trim() || null,
    openingHoursBis: data.openingHoursBis?.trim() || null,
    addressEn: data.addressEn?.trim() || null,
    rating:
      typeof data.rating === "number" && Number.isFinite(data.rating) ? data.rating : 4,
    isActive: data.isActive !== false,
  };
}

export async function createMapHotel(
  data: MapPlaceWriteInput
): Promise<ActionResult & { id?: string }> {
  try {
    await requirePermission("manage_map");
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Name (EN) is required." };
    let slug = slugify(data.slug?.trim() || nameEn);
    if (!slug) slug = `hotel-${Date.now()}`;
    const clash = await db.mapHotel.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;
    const maxSort = await db.mapHotel.aggregate({ _max: { sortOrder: true } });
    const created = await db.mapHotel.create({
      data: {
        slug,
        ...placeWriteData(data, nameEn),
        mapX: clampPercent(data.mapX ?? 50),
        mapY: clampPercent(data.mapY ?? 40),
        sortOrder:
          typeof data.sortOrder === "number"
            ? data.sortOrder
            : (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    revalidateMapAdmin();
    return { success: true, id: created.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create hotel",
    };
  }
}

export async function updateMapHotel(
  id: string,
  data: MapPlaceWriteInput
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    const existing = await db.mapHotel.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Hotel not found." };
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Name (EN) is required." };
    let slug = existing.slug;
    if (data.slug?.trim()) {
      const next = slugify(data.slug);
      if (next && next !== existing.slug) {
        const clash = await db.mapHotel.findUnique({ where: { slug: next } });
        if (clash && clash.id !== id) return { success: false, error: "Slug already in use." };
        slug = next;
      }
    }
    await db.mapHotel.update({
      where: { id },
      data: {
        slug,
        ...placeWriteData(data, nameEn),
        sortOrder:
          typeof data.sortOrder === "number" ? data.sortOrder : existing.sortOrder,
      },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update hotel",
    };
  }
}

export async function updateMapHotelPosition(
  id: string,
  mapX: number,
  mapY: number
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    await db.mapHotel.update({
      where: { id },
      data: { mapX: clampPercent(mapX), mapY: clampPercent(mapY) },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to move hotel",
    };
  }
}

export async function deleteMapHotel(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    await db.mapHotel.delete({ where: { id } });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete hotel",
    };
  }
}

export async function createMapRestaurant(
  data: MapPlaceWriteInput
): Promise<ActionResult & { id?: string }> {
  try {
    await requirePermission("manage_map");
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Name (EN) is required." };
    let slug = slugify(data.slug?.trim() || nameEn);
    if (!slug) slug = `restaurant-${Date.now()}`;
    const clash = await db.mapRestaurant.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;
    const maxSort = await db.mapRestaurant.aggregate({ _max: { sortOrder: true } });
    const created = await db.mapRestaurant.create({
      data: {
        slug,
        ...placeWriteData(data, nameEn),
        mapX: clampPercent(data.mapX ?? 50),
        mapY: clampPercent(data.mapY ?? 40),
        sortOrder:
          typeof data.sortOrder === "number"
            ? data.sortOrder
            : (maxSort._max.sortOrder ?? 0) + 1,
      },
    });
    revalidateMapAdmin();
    return { success: true, id: created.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create restaurant",
    };
  }
}

export async function updateMapRestaurant(
  id: string,
  data: MapPlaceWriteInput
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    const existing = await db.mapRestaurant.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Restaurant not found." };
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Name (EN) is required." };
    let slug = existing.slug;
    if (data.slug?.trim()) {
      const next = slugify(data.slug);
      if (next && next !== existing.slug) {
        const clash = await db.mapRestaurant.findUnique({ where: { slug: next } });
        if (clash && clash.id !== id) return { success: false, error: "Slug already in use." };
        slug = next;
      }
    }
    await db.mapRestaurant.update({
      where: { id },
      data: {
        slug,
        ...placeWriteData(data, nameEn),
        sortOrder:
          typeof data.sortOrder === "number" ? data.sortOrder : existing.sortOrder,
      },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update restaurant",
    };
  }
}

export async function updateMapRestaurantPosition(
  id: string,
  mapX: number,
  mapY: number
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    await db.mapRestaurant.update({
      where: { id },
      data: { mapX: clampPercent(mapX), mapY: clampPercent(mapY) },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to move restaurant",
    };
  }
}

export async function deleteMapRestaurant(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    await db.mapRestaurant.delete({ where: { id } });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete restaurant",
    };
  }
}

/* ---------- Categories ---------- */

export async function createMapCategory(
  data: MapCategoryWriteInput
): Promise<ActionResult & { id?: string }> {
  try {
    await requirePermission("manage_map");
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Name (EN) is required." };
    let slug = slugify(data.slug?.trim() || nameEn);
    if (!slug) slug = `category-${Date.now()}`;
    const clash = await db.mapCategory.findUnique({ where: { slug } });
    if (clash) return { success: false, error: "Slug already in use." };
    const maxSort = await db.mapCategory.aggregate({ _max: { sortOrder: true } });
    const created = await db.mapCategory.create({
      data: {
        slug,
        nameEn,
        nameFil: data.nameFil?.trim() || nameEn,
        nameBis: data.nameBis?.trim() || data.nameFil?.trim() || nameEn,
        color: data.color?.trim() || "#0f766e",
        icon: data.icon?.trim() || null,
        sortOrder:
          typeof data.sortOrder === "number"
            ? data.sortOrder
            : (maxSort._max.sortOrder ?? 0) + 1,
        showInFilter: data.showInFilter !== false,
        showInLegend: data.showInLegend !== false,
      },
    });
    revalidateMapAdmin();
    return { success: true, id: created.id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create category",
    };
  }
}

export async function updateMapCategory(
  id: string,
  data: MapCategoryWriteInput
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    const existing = await db.mapCategory.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Category not found." };
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Name (EN) is required." };

    let slug = existing.slug;
    if (data.slug?.trim()) {
      const next = slugify(data.slug);
      if (next && next !== existing.slug) {
        const clash = await db.mapCategory.findUnique({ where: { slug: next } });
        if (clash && clash.id !== id) return { success: false, error: "Slug already in use." };
        slug = next;
      }
    }

    await db.mapCategory.update({
      where: { id },
      data: {
        slug,
        nameEn,
        nameFil: data.nameFil?.trim() || nameEn,
        nameBis: data.nameBis?.trim() || data.nameFil?.trim() || nameEn,
        color: data.color?.trim() || existing.color,
        icon: data.icon?.trim() || null,
        sortOrder:
          typeof data.sortOrder === "number" ? data.sortOrder : existing.sortOrder,
        showInFilter: data.showInFilter !== false,
        showInLegend: data.showInLegend !== false,
      },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update category",
    };
  }
}

export async function deleteMapCategory(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    const count = await db.mapAttraction.count({ where: { categoryId: id } });
    if (count > 0) {
      return {
        success: false,
        error: `Cannot delete: ${count} attraction(s) still use this category.`,
      };
    }
    await db.mapCategory.delete({ where: { id } });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete category",
    };
  }
}

/* ---------- Municipalities ---------- */

export async function updateMapMunicipality(
  id: string,
  data: MapMunicipalityWriteInput
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    const existing = await db.mapMunicipality.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Municipality not found." };
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Name (EN) is required." };

    await db.mapMunicipality.update({
      where: { id },
      data: {
        nameEn,
        nameFil: data.nameFil?.trim() || nameEn,
        nameBis: data.nameBis?.trim() || data.nameFil?.trim() || nameEn,
        description: data.description?.trim() || null,
        labelX:
          typeof data.labelX === "number" ? clampPercent(data.labelX) : existing.labelX,
        labelY:
          typeof data.labelY === "number" ? clampPercent(data.labelY) : existing.labelY,
      },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update municipality",
    };
  }
}

export async function deleteMapMunicipality(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    const existing = await db.mapMunicipality.findUnique({ where: { id } });
    if (!existing) return { success: false, error: "Municipality not found." };

    // Clear FK references so attractions remain usable without this municipality
    await db.mapAttraction.updateMany({
      where: { municipalityId: id },
      data: { municipalityId: null },
    });
    await db.mapMunicipality.delete({ where: { id } });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to delete municipality",
    };
  }
}

export async function updateMapMunicipalityLabelPosition(
  id: string,
  labelX: number,
  labelY: number
): Promise<ActionResult> {
  try {
    await requirePermission("manage_map");
    await db.mapMunicipality.update({
      where: { id },
      data: { labelX: clampPercent(labelX), labelY: clampPercent(labelY) },
    });
    revalidateMapAdmin();
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to move municipality label",
    };
  }
}
