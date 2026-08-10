/**
 * Server-side indoor map data loader (NOT a Server Action).
 */
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import type {
  IndoorAmenityRow,
  IndoorBuildingSummary,
  IndoorFloorAssetRow,
  IndoorFloorDetail,
  IndoorFloorSummary,
  IndoorNavEdgeRow,
  IndoorNavNodeRow,
  IndoorRoomRow,
  PublishedIndoorPayload,
} from "./types";

function mapBuilding(
  b: {
    id: string;
    slug: string;
    nameEn: string;
    nameFil: string | null;
    nameBis: string | null;
    address: string | null;
    isActive: boolean;
    _count?: { floors: number };
  },
  floorCount?: number
): IndoorBuildingSummary {
  return {
    id: b.id,
    slug: b.slug,
    nameEn: b.nameEn,
    nameFil: b.nameFil,
    nameBis: b.nameBis,
    address: b.address,
    isActive: b.isActive,
    floorCount: floorCount ?? b._count?.floors ?? 0,
  };
}

function mapFloor(f: {
  id: string;
  buildingId: string;
  levelIndex: number;
  labelEn: string;
  labelFil: string | null;
  labelBis: string | null;
  widthPx: number;
  heightPx: number;
  metersPerPixel: number;
  opacity: number;
  sortOrder: number;
  isPublished: boolean;
  publishedAt: Date | null;
  assets?: Array<{ url: string; locked: boolean }>;
  _count?: { rooms: number; navNodes: number };
}): IndoorFloorSummary {
  const asset = f.assets?.[0];
  return {
    id: f.id,
    buildingId: f.buildingId,
    levelIndex: f.levelIndex,
    labelEn: f.labelEn,
    labelFil: f.labelFil,
    labelBis: f.labelBis,
    widthPx: f.widthPx,
    heightPx: f.heightPx,
    metersPerPixel: f.metersPerPixel,
    opacity: f.opacity,
    sortOrder: f.sortOrder,
    isPublished: f.isPublished,
    publishedAt: f.publishedAt?.toISOString() ?? null,
    assetUrl: asset?.url ?? null,
    assetLocked: asset?.locked ?? false,
    roomCount: f._count?.rooms ?? 0,
    nodeCount: f._count?.navNodes ?? 0,
  };
}

function mapRoom(r: {
  id: string;
  floorId: string;
  roomNumber: string | null;
  nameEn: string;
  nameFil: string | null;
  nameBis: string | null;
  department: string | null;
  descriptionEn: string | null;
  descriptionFil: string | null;
  descriptionBis: string | null;
  capacity: number | null;
  category: string;
  accessibility: string;
  hoursEn: string | null;
  hoursFil: string | null;
  hoursBis: string | null;
  photoUrl: string | null;
  qrPayload: string | null;
  geometryJson: string;
  isActive: boolean;
  sortOrder: number;
}): IndoorRoomRow {
  return { ...r };
}

function mapAmenity(a: {
  id: string;
  floorId: string;
  kind: string;
  label: string | null;
  geometryJson: string;
  propsJson: string | null;
  isActive: boolean;
  sortOrder: number;
}): IndoorAmenityRow {
  return { ...a };
}

function mapNode(n: {
  id: string;
  floorId: string;
  type: string;
  x: number;
  y: number;
  label: string | null;
  roomId: string | null;
  wheelchairAccessible: boolean;
}): IndoorNavNodeRow {
  return { ...n };
}

function mapEdge(e: {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  distanceMeters: number;
  wheelchairAccessible: boolean;
  vertical: boolean;
  verticalToFloorId: string | null;
  instruction: string | null;
}): IndoorNavEdgeRow {
  return { ...e };
}

export async function loadIndoorAdminHome(): Promise<{
  buildings: IndoorBuildingSummary[];
  floors: IndoorFloorSummary[];
}> {
  await requirePermission("manage_indoor_map");
  const buildings = await db.indoorBuilding.findMany({
    include: { _count: { select: { floors: true } } },
    orderBy: { nameEn: "asc" },
  });
  const floors = await db.indoorFloor.findMany({
    include: {
      assets: { orderBy: { sortOrder: "asc" }, take: 1 },
      _count: { select: { rooms: true, navNodes: true } },
    },
    orderBy: [{ buildingId: "asc" }, { sortOrder: "asc" }, { levelIndex: "asc" }],
  });
  return {
    buildings: buildings.map((b) => mapBuilding(b)),
    floors: floors.map((f) => mapFloor(f)),
  };
}

export async function loadIndoorFloorDetail(floorId: string): Promise<IndoorFloorDetail | null> {
  await requirePermission("manage_indoor_map");
  const floor = await db.indoorFloor.findUnique({
    where: { id: floorId },
    include: {
      building: true,
      assets: { orderBy: { sortOrder: "asc" } },
      rooms: { orderBy: { sortOrder: "asc" } },
      amenities: { orderBy: { sortOrder: "asc" } },
      navNodes: { orderBy: { createdAt: "asc" } },
      _count: { select: { rooms: true, navNodes: true } },
    },
  });
  if (!floor) return null;

  const nodeIds = floor.navNodes.map((n) => n.id);
  const edges =
    nodeIds.length === 0
      ? []
      : await db.indoorNavEdge.findMany({
          where: {
            OR: [{ fromNodeId: { in: nodeIds } }, { toNodeId: { in: nodeIds } }],
          },
        });

  const assets: IndoorFloorAssetRow[] = floor.assets.map((a) => ({
    id: a.id,
    floorId: a.floorId,
    kind: a.kind,
    mimeType: a.mimeType,
    url: a.url,
    originalName: a.originalName,
    locked: a.locked,
  }));

  return {
    floor: mapFloor(floor),
    building: mapBuilding(floor.building, 0),
    assets,
    rooms: floor.rooms.map(mapRoom),
    amenities: floor.amenities.map(mapAmenity),
    nodes: floor.navNodes.map(mapNode),
    edges: edges.map(mapEdge),
  };
}

export async function loadPublishedIndoorMap(): Promise<PublishedIndoorPayload> {
  const buildings = await db.indoorBuilding.findMany({
    where: { isActive: true },
    include: {
      floors: {
        where: { isPublished: true },
        include: {
          assets: { orderBy: { sortOrder: "asc" }, take: 1 },
          rooms: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
          amenities: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
          navNodes: true,
        },
        orderBy: [{ sortOrder: "asc" }, { levelIndex: "asc" }],
      },
    },
    orderBy: { nameEn: "asc" },
  });

  const allNodeIds = buildings.flatMap((b) => b.floors.flatMap((f) => f.navNodes.map((n) => n.id)));
  const edges =
    allNodeIds.length === 0
      ? []
      : await db.indoorNavEdge.findMany({
          where: {
            OR: [{ fromNodeId: { in: allNodeIds } }, { toNodeId: { in: allNodeIds } }],
          },
        });

  return {
    buildings: buildings.map((b) => ({
      id: b.id,
      slug: b.slug,
      nameEn: b.nameEn,
      nameFil: b.nameFil,
      nameBis: b.nameBis,
      floors: b.floors.map((f) => ({
        id: f.id,
        levelIndex: f.levelIndex,
        labelEn: f.labelEn,
        labelFil: f.labelFil,
        labelBis: f.labelBis,
        widthPx: f.widthPx,
        heightPx: f.heightPx,
        metersPerPixel: f.metersPerPixel,
        opacity: f.opacity,
        assetUrl: f.assets[0]?.url ?? null,
        rooms: f.rooms.map(mapRoom),
        amenities: f.amenities.map(mapAmenity),
        nodes: f.navNodes.map(mapNode),
        edges: edges
          .filter(
            (e) =>
              f.navNodes.some((n) => n.id === e.fromNodeId) ||
              f.navNodes.some((n) => n.id === e.toNodeId)
          )
          .map(mapEdge),
      })),
    })),
  };
}
