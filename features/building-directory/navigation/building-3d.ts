import type { OrthographicCamera } from "three";
import type { FloorPlanConfig, NavigationGraph, NavigationRoute, NavNode } from "./types";

export const FLOOR_HEIGHT = 4.2;
/** Default schematic scale (demo academic building ~620×360). */
export const PLAN_SCALE = 0.1;
/** Target world-space size for image-based floor plans (longest side). */
export const IMAGE_PLAN_TARGET = 72;

export const KIOSK_LOCATION = {
  floor: 1,
  x: 468,
  y: 455,
  locationId: "gf-kiosk",
  nodeId: "gf_kiosk",
  labelEn: "You are here",
  labelFil: "Nandito ka",
  labelBis: "Ania ka",
} as const;

export type KioskLocationConfig = {
  floor: number;
  x: number;
  y: number;
  locationId: string;
  nodeId: string;
  labelEn: string;
  labelFil: string;
  labelBis?: string;
};

export const WALL_THICKNESS = 0.14;
export const WALL_HEIGHT = 2.8;

/** Vertical layers to prevent z-fighting between floor, paths, and markers */
export const FLOOR_LAYERS = {
  slabY: 0,
  slabH: 0.1,
  hallwayY: 0.11,
  hallwayH: 0.015,
  roomFloorY: 0.13,
  pathY: 0.32,
  pathWalkedY: 0.34,
  pathRemainingY: 0.36,
  markerY: 0.38,
} as const;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function getActivePlan(graph: NavigationGraph, viewFloor?: number): FloorPlanConfig | undefined {
  if (viewFloor != null) {
    return graph.floorPlans.find((f) => f.floor === viewFloor) ?? graph.floorPlans[0];
  }
  return graph.floorPlans[0];
}

export function getPlanScale(graph: NavigationGraph, viewFloor?: number): number {
  const plan = getActivePlan(graph, viewFloor);
  if (!plan) return PLAN_SCALE;
  if (plan.imageUrl) {
    const longest = Math.max(plan.width, plan.height);
    if (longest <= 0) return PLAN_SCALE;
    return IMAGE_PLAN_TARGET / longest;
  }
  return PLAN_SCALE;
}

export function graphHasFloorPlanImages(graph: NavigationGraph): boolean {
  return graph.floorPlans.some((f) => Boolean(f.imageUrl));
}

export function getPlanCenter(graph: NavigationGraph, viewFloor?: number) {
  const plan = getActivePlan(graph, viewFloor) ?? graph.floorPlans[0];
  if (!plan) return { cx: 0, cy: 0 };
  return { cx: plan.width / 2, cy: plan.height / 2 };
}

export function getFloorExtents(graph: NavigationGraph, viewFloor?: number) {
  const plan = getActivePlan(graph, viewFloor);
  if (!plan) return { width: 40, depth: 24 };
  const scale = getPlanScale(graph, viewFloor);
  return {
    width: plan.width * scale + 4,
    depth: plan.height * scale + 4,
  };
}

/** Padding multiplier so the full floor slab fits in an orthographic view. */
export function fitOrthographicZoom(
  camera: OrthographicCamera,
  floorWidth: number,
  floorDepth: number,
  padding = 1.15,
  viewportWidth?: number,
  viewportHeight?: number
) {
  let frustumW = camera.right - camera.left;
  let frustumH = camera.top - camera.bottom;

  if ((frustumW <= 0 || frustumH <= 0) && viewportWidth && viewportHeight) {
    const aspect = viewportWidth / Math.max(viewportHeight, 1);
    frustumH = 10;
    frustumW = frustumH * aspect;
    camera.left = -frustumW / 2;
    camera.right = frustumW / 2;
    camera.top = frustumH / 2;
    camera.bottom = -frustumH / 2;
  }

  frustumW = camera.right - camera.left;
  frustumH = camera.top - camera.bottom;
  if (frustumW <= 0 || frustumH <= 0) return false;

  const zoomW = frustumW / (floorWidth * padding);
  const zoomH = frustumH / (floorDepth * padding);
  const zoom = Math.min(zoomW, zoomH);
  if (!Number.isFinite(zoom) || zoom <= 0) return false;

  camera.zoom = Math.min(3, Math.max(0.08, zoom));
  camera.updateProjectionMatrix();
  return true;
}

export function map2DTo3D(
  x: number,
  y: number,
  floor: number,
  graph: NavigationGraph
): Vec3 {
  const { cx, cy } = getPlanCenter(graph, floor);
  const scale = getPlanScale(graph, floor);
  return {
    x: (x - cx) * scale,
    y: (floor - 1) * FLOOR_HEIGHT,
    z: (y - cy) * scale,
  };
}

export function findNode(
  graph: NavigationGraph,
  idOrLocationId?: string
): NavNode | undefined {
  if (!idOrLocationId) return undefined;
  return graph.nodes.find(
    (n) => n.id === idOrLocationId || n.locationId === idOrLocationId
  );
}

export function nodeSize(node: NavNode): { w: number; d: number; h: number } {
  switch (node.type) {
    case "room":
      return { w: 5.6, d: 3.6, h: WALL_HEIGHT };
    case "facility":
      return { w: 4, d: 3, h: WALL_HEIGHT * 0.85 };
    case "elevator":
      return { w: 2.4, d: 2.4, h: WALL_HEIGHT };
    case "staircase":
      return { w: 3.2, d: 3.2, h: WALL_HEIGHT };
    case "entrance":
      return { w: 4, d: 2, h: WALL_HEIGHT * 0.6 };
    case "emergency_exit":
      return { w: 3.5, d: 2.5, h: WALL_HEIGHT * 0.7 };
    default:
      return { w: 2, d: 2, h: 1.2 };
  }
}

/** Extruded mall-style blocks on top of a floor-plan image. */
export function nodeSizeForImagePlan(node: NavNode): { w: number; d: number; h: number } {
  const base = nodeSize(node);
  const shrink =
    node.type === "room" ? 0.58 : node.type === "facility" ? 0.54 : 0.62;
  const height =
    node.type === "room"
      ? 1.35
      : node.type === "facility"
        ? 1.05
        : node.type === "elevator" || node.type === "staircase"
          ? 1.2
          : 0.9;
  return {
    w: base.w * shrink,
    d: base.d * shrink,
    h: height,
  };
}

export function nodeExtrudedColors(
  node: NavNode,
  highlighted: boolean
): { body: string; emissive: string } {
  if (highlighted) return { body: "#fcd34d", emissive: "#f59e0b" };
  switch (node.type) {
    case "room":
      return { body: "#e85d6a", emissive: "#be123c" };
    case "facility":
      return { body: "#9ca3af", emissive: "#475569" };
    case "elevator":
      return { body: "#7da8d8", emissive: "#2563eb" };
    case "staircase":
      return { body: "#94a3b8", emissive: "#475569" };
    case "entrance":
      return { body: "#6ee7b7", emissive: "#059669" };
    case "emergency_exit":
      return { body: "#fca5a5", emissive: "#dc2626" };
    default:
      return { body: "#cbd5e1", emissive: "#64748b" };
  }
}

export function nodeColor(node: NavNode, highlighted: boolean): string {
  if (highlighted) return "#facc15";
  switch (node.type) {
    case "room":
      return "#e8f0fe";
    case "facility":
      return "#f0fdf4";
    case "elevator":
      return "#ddd6fe";
    case "staircase":
      return "#ffedd5";
    case "entrance":
      return "#dcfce7";
    case "emergency_exit":
      return "#fee2e2";
    default:
      return "#f1f5f9";
  }
}

export function map2DToFloorPlan3D(
  x: number,
  y: number,
  graph: NavigationGraph,
  viewFloor?: number
): Vec3 {
  const { cx, cy } = getPlanCenter(graph, viewFloor);
  const scale = getPlanScale(graph, viewFloor);
  return {
    x: (x - cx) * scale,
    y: 0,
    z: (y - cy) * scale,
  };
}

export function routeTo3DPoints(
  route: NavigationRoute,
  graph: NavigationGraph,
  floor?: number
): Vec3[] {
  const points: Vec3[] = [];
  const segments = floor
    ? route.segments.filter((s) => s.floor === floor)
    : route.segments;

  for (const segment of segments) {
    for (const p of segment.points) {
      points.push(
        floor
          ? map2DToFloorPlan3D(p.x, p.y, graph, floor)
          : map2DTo3D(p.x, p.y, segment.floor, graph)
      );
    }
  }
  return points;
}

export function getElevatorShafts(graph: NavigationGraph) {
  const elevators = graph.nodes.filter((n) => n.type === "elevator");
  const byX = new Map<string, NavNode[]>();

  for (const e of elevators) {
    const key = `${Math.round(e.x)}-${Math.round(e.y)}`;
    const group = byX.get(key) ?? [];
    group.push(e);
    byX.set(key, group);
  }

  return Array.from(byX.values()).map((group) => {
    const sorted = [...group].sort((a, b) => a.floor - b.floor);
    const anchor = sorted[0];
    const pos = map2DTo3D(anchor.x, anchor.y, anchor.floor, graph);
    const floors = sorted.length;
    return {
      ...pos,
      height: FLOOR_HEIGHT * floors + 0.5,
      floors,
    };
  });
}
