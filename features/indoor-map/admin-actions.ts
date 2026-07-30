"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { euclideanMeters, postgisSyncSql } from "./geo";
import { findIndoorRouteAStar } from "./astar";
import type { IndoorRouteResult } from "./types";

type ActionResult = { success: true } | { success: false; error: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function revalidateIndoor() {
  revalidatePath("/admin/indoor-map");
  revalidatePath("/building-directory");
}

async function syncGeom(table: "IndoorRoom" | "IndoorAmenity", id: string, geometryJson: string) {
  try {
    const { sql, params } = postgisSyncSql(table, id, geometryJson);
    await db.$executeRawUnsafe(sql, ...params);
  } catch {
    // PostGIS optional — GeoJSON column remains source of truth
  }
}

export async function createIndoorBuilding(data: {
  nameEn: string;
  nameFil?: string;
  nameBis?: string;
  address?: string;
  slug?: string;
}): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Building name is required." };
    let slug = slugify(data.slug || nameEn) || `building-${Date.now()}`;
    const clash = await db.indoorBuilding.findUnique({ where: { slug } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;
    const created = await db.indoorBuilding.create({
      data: {
        slug,
        nameEn,
        nameFil: data.nameFil?.trim() || null,
        nameBis: data.nameBis?.trim() || null,
        address: data.address?.trim() || null,
      },
    });
    revalidateIndoor();
    return { success: true, id: created.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create building" };
  }
}

export async function createIndoorFloor(data: {
  buildingId: string;
  levelIndex: number;
  labelEn: string;
  labelFil?: string;
  labelBis?: string;
  metersPerPixel?: number;
}): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
    const labelEn = data.labelEn?.trim();
    if (!labelEn) return { success: false, error: "Floor label is required." };
    if (!data.buildingId) return { success: false, error: "Building is required." };
    const created = await db.indoorFloor.create({
      data: {
        buildingId: data.buildingId,
        levelIndex: data.levelIndex,
        labelEn,
        labelFil: data.labelFil?.trim() || null,
        labelBis: data.labelBis?.trim() || null,
        metersPerPixel: data.metersPerPixel ?? 0.05,
        sortOrder: data.levelIndex,
      },
    });
    revalidateIndoor();
    return { success: true, id: created.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to create floor" };
  }
}

export async function updateIndoorFloorSettings(
  floorId: string,
  data: {
    labelEn?: string;
    labelFil?: string;
    labelBis?: string;
    opacity?: number;
    metersPerPixel?: number;
    widthPx?: number;
    heightPx?: number;
  }
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.indoorFloor.update({
      where: { id: floorId },
      data: {
        ...(data.labelEn != null ? { labelEn: data.labelEn.trim() } : {}),
        ...(data.labelFil != null ? { labelFil: data.labelFil.trim() || null } : {}),
        ...(data.labelBis != null ? { labelBis: data.labelBis.trim() || null } : {}),
        ...(data.opacity != null ? { opacity: Math.min(1, Math.max(0.1, data.opacity)) } : {}),
        ...(data.metersPerPixel != null ? { metersPerPixel: data.metersPerPixel } : {}),
        ...(data.widthPx != null ? { widthPx: data.widthPx } : {}),
        ...(data.heightPx != null ? { heightPx: data.heightPx } : {}),
      },
    });
    revalidateIndoor();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update floor" };
  }
}

export async function attachFloorPlanAsset(data: {
  floorId: string;
  url: string;
  mimeType: string;
  originalName: string;
  widthPx: number;
  heightPx: number;
}): Promise<ActionResult & { assetId?: string }> {
  try {
    await requireAdmin();
    await db.indoorFloorAsset.deleteMany({ where: { floorId: data.floorId, kind: "reference" } });
    const asset = await db.indoorFloorAsset.create({
      data: {
        floorId: data.floorId,
        kind: "reference",
        url: data.url,
        mimeType: data.mimeType,
        originalName: data.originalName,
        locked: false,
      },
    });
    await db.indoorFloor.update({
      where: { id: data.floorId },
      data: { widthPx: data.widthPx, heightPx: data.heightPx },
    });
    revalidateIndoor();
    return { success: true, assetId: asset.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to attach floor plan" };
  }
}

export async function setFloorAssetLocked(assetId: string, locked: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.indoorFloorAsset.update({ where: { id: assetId }, data: { locked } });
    revalidateIndoor();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to update lock" };
  }
}

export async function upsertIndoorRoom(data: {
  id?: string;
  floorId: string;
  roomNumber?: string;
  nameEn: string;
  nameFil?: string;
  nameBis?: string;
  department?: string;
  descriptionEn?: string;
  descriptionFil?: string;
  descriptionBis?: string;
  capacity?: number | null;
  category?: string;
  accessibility?: string;
  hoursEn?: string;
  hoursFil?: string;
  hoursBis?: string;
  photoUrl?: string;
  qrPayload?: string;
  geometryJson: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
    const nameEn = data.nameEn?.trim();
    if (!nameEn) return { success: false, error: "Room name is required." };
    if (!data.geometryJson) return { success: false, error: "Room geometry is required." };

    const payload = {
      floorId: data.floorId,
      roomNumber: data.roomNumber?.trim() || null,
      nameEn,
      nameFil: data.nameFil?.trim() || null,
      nameBis: data.nameBis?.trim() || null,
      department: data.department?.trim() || null,
      descriptionEn: data.descriptionEn?.trim() || null,
      descriptionFil: data.descriptionFil?.trim() || null,
      descriptionBis: data.descriptionBis?.trim() || null,
      capacity: data.capacity ?? null,
      category: data.category || "office",
      accessibility: data.accessibility || "standard",
      hoursEn: data.hoursEn?.trim() || null,
      hoursFil: data.hoursFil?.trim() || null,
      hoursBis: data.hoursBis?.trim() || null,
      photoUrl: data.photoUrl?.trim() || null,
      qrPayload: data.qrPayload?.trim() || null,
      geometryJson: data.geometryJson,
      isActive: data.isActive !== false,
      sortOrder: data.sortOrder ?? 0,
    };

    const row = data.id
      ? await db.indoorRoom.update({ where: { id: data.id }, data: payload })
      : await db.indoorRoom.create({ data: payload });

    await syncGeom("IndoorRoom", row.id, data.geometryJson);
    revalidateIndoor();
    return { success: true, id: row.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save room" };
  }
}

export async function deleteIndoorRoom(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.indoorRoom.delete({ where: { id } });
    revalidateIndoor();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete room" };
  }
}

export async function upsertIndoorAmenity(data: {
  id?: string;
  floorId: string;
  kind: string;
  label?: string;
  geometryJson: string;
  propsJson?: string;
}): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
    if (!data.kind) return { success: false, error: "Amenity kind is required." };
    const payload = {
      floorId: data.floorId,
      kind: data.kind,
      label: data.label?.trim() || null,
      geometryJson: data.geometryJson,
      propsJson: data.propsJson || null,
    };
    const row = data.id
      ? await db.indoorAmenity.update({ where: { id: data.id }, data: payload })
      : await db.indoorAmenity.create({ data: payload });
    await syncGeom("IndoorAmenity", row.id, data.geometryJson);
    revalidateIndoor();
    return { success: true, id: row.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save amenity" };
  }
}

export async function deleteIndoorAmenity(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.indoorAmenity.delete({ where: { id } });
    revalidateIndoor();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete amenity" };
  }
}

export async function upsertIndoorNavNode(data: {
  id?: string;
  floorId: string;
  type: string;
  x: number;
  y: number;
  label?: string;
  roomId?: string | null;
  wheelchairAccessible?: boolean;
}): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
    const payload = {
      floorId: data.floorId,
      type: data.type || "intersection",
      x: data.x,
      y: data.y,
      label: data.label?.trim() || null,
      roomId: data.roomId || null,
      wheelchairAccessible: data.wheelchairAccessible !== false,
    };
    const row = data.id
      ? await db.indoorNavNode.update({ where: { id: data.id }, data: payload })
      : await db.indoorNavNode.create({ data: payload });
    revalidateIndoor();
    return { success: true, id: row.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to save node" };
  }
}

export async function deleteIndoorNavNode(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.indoorNavEdge.deleteMany({
      where: { OR: [{ fromNodeId: id }, { toNodeId: id }] },
    });
    await db.indoorNavNode.delete({ where: { id } });
    revalidateIndoor();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete node" };
  }
}

export async function connectIndoorNavNodes(data: {
  fromNodeId: string;
  toNodeId: string;
  wheelchairAccessible?: boolean;
  vertical?: boolean;
  verticalToFloorId?: string | null;
  instruction?: string;
}): Promise<ActionResult & { id?: string }> {
  try {
    await requireAdmin();
    if (data.fromNodeId === data.toNodeId) {
      return { success: false, error: "Cannot connect a node to itself." };
    }
    const [from, to] = await Promise.all([
      db.indoorNavNode.findUnique({ where: { id: data.fromNodeId }, include: { floor: true } }),
      db.indoorNavNode.findUnique({ where: { id: data.toNodeId }, include: { floor: true } }),
    ]);
    if (!from || !to) return { success: false, error: "Node not found." };

    const vertical = data.vertical ?? from.floorId !== to.floorId;
    const mpp = from.floor.metersPerPixel || 0.05;
    const distanceMeters = vertical
      ? 5
      : euclideanMeters(from.x, from.y, to.x, to.y, mpp);

    const existing = await db.indoorNavEdge.findUnique({
      where: {
        fromNodeId_toNodeId: { fromNodeId: data.fromNodeId, toNodeId: data.toNodeId },
      },
    });
    const row = existing
      ? await db.indoorNavEdge.update({
          where: { id: existing.id },
          data: {
            distanceMeters,
            wheelchairAccessible: data.wheelchairAccessible !== false,
            vertical,
            verticalToFloorId: data.verticalToFloorId ?? (vertical ? to.floorId : null),
            instruction: data.instruction?.trim() || null,
          },
        })
      : await db.indoorNavEdge.create({
          data: {
            fromNodeId: data.fromNodeId,
            toNodeId: data.toNodeId,
            distanceMeters,
            wheelchairAccessible: data.wheelchairAccessible !== false,
            vertical,
            verticalToFloorId: data.verticalToFloorId ?? (vertical ? to.floorId : null),
            instruction: data.instruction?.trim() || null,
          },
        });
    revalidateIndoor();
    return { success: true, id: row.id };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to connect nodes" };
  }
}

export async function deleteIndoorNavEdge(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.indoorNavEdge.delete({ where: { id } });
    revalidateIndoor();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete edge" };
  }
}

export async function publishIndoorFloor(floorId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.indoorFloor.update({
      where: { id: floorId },
      data: { isPublished: true, publishedAt: new Date() },
    });
    revalidateIndoor();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to publish floor" };
  }
}

export async function unpublishIndoorFloor(floorId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.indoorFloor.update({
      where: { id: floorId },
      data: { isPublished: false },
    });
    revalidateIndoor();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to unpublish floor" };
  }
}

export async function deleteIndoorFloor(floorId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await db.indoorFloor.delete({ where: { id: floorId } });
    revalidateIndoor();
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete floor" };
  }
}

export async function computeIndoorRoute(data: {
  fromNodeId: string;
  toNodeId: string;
  wheelchairOnly?: boolean;
}): Promise<ActionResult & { route?: IndoorRouteResult }> {
  try {
    const nodes = await db.indoorNavNode.findMany();
    const edges = await db.indoorNavEdge.findMany();
    const floors = await db.indoorFloor.findMany({
      select: { id: true, levelIndex: true, labelEn: true },
    });
    const toNode = nodes.find((n) => n.id === data.toNodeId);
    let destinationName = toNode?.label || "Destination";
    if (toNode?.roomId) {
      const room = await db.indoorRoom.findUnique({ where: { id: toNode.roomId } });
      if (room) destinationName = room.nameEn;
    }
    const route = findIndoorRouteAStar(data.fromNodeId, data.toNodeId, {
      nodes,
      edges,
      floors: floors.map((f) => ({ id: f.id, levelIndex: f.levelIndex, label: f.labelEn })),
      destinationRoomId: toNode?.roomId,
      destinationName,
      wheelchairOnly: data.wheelchairOnly,
    });
    if (!route) return { success: false, error: "No route found between those points." };
    return { success: true, route };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Routing failed" };
  }
}
