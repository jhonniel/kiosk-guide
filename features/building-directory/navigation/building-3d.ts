import type { OrthographicCamera } from "three";
import type { NavigationGraph, NavigationRoute, NavNode } from "./types";

export const FLOOR_HEIGHT = 4.2;
export const PLAN_SCALE = 0.1;
export const KIOSK_LOCATION = {
  floor: 1,
  x: 105,
  y: 200,
  locationId: "f1-kiosk",
  nodeId: "f1_kiosk",
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

export function getPlanCenter(graph: NavigationGraph) {
  const plan = graph.floorPlans[0];
  return { cx: plan.width / 2, cy: plan.height / 2 };
}

export function getFloorExtents(graph: NavigationGraph, viewFloor?: number) {
  const plan =
    graph.floorPlans.find((f) => f.floor === viewFloor) ?? graph.floorPlans[0];
  if (!plan) return { width: 40, depth: 24 };
  return {
    width: plan.width * PLAN_SCALE + 4,
    depth: plan.height * PLAN_SCALE + 4,
  };
}

/** Padding multiplier so the full floor slab fits in an orthographic view. */
export function fitOrthographicZoom(
  camera: OrthographicCamera,
  floorWidth: number,
  floorDepth: number,
  padding = 1.15
) {
  const frustumW = camera.right - camera.left;
  const frustumH = camera.top - camera.bottom;
  if (frustumW <= 0 || frustumH <= 0) return;
  const zoomW = frustumW / (floorWidth * padding);
  const zoomH = frustumH / (floorDepth * padding);
  const zoom = Math.min(zoomW, zoomH);
  if (!Number.isFinite(zoom) || zoom <= 0) return;
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
}

export function map2DTo3D(
  x: number,
  y: number,
  floor: number,
  graph: NavigationGraph
): Vec3 {
  const { cx, cy } = getPlanCenter(graph);
  return {
    x: (x - cx) * PLAN_SCALE,
    y: (floor - 1) * FLOOR_HEIGHT,
    z: (y - cy) * PLAN_SCALE,
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
  graph: NavigationGraph
): Vec3 {
  const { cx, cy } = getPlanCenter(graph);
  return {
    x: (x - cx) * PLAN_SCALE,
    y: 0,
    z: (y - cy) * PLAN_SCALE,
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
          ? map2DToFloorPlan3D(p.x, p.y, graph)
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
