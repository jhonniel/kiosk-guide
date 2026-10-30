import type {
  NavigationGraph,
  NavEdge,
  NavNode,
  NavigationRoute,
  NavigationSegment,
} from "./types";
import {
  officeDoorOnHallway,
  routeAroundUpperHallWell,
  stairHallApproachPlanPoints,
} from "./building-3d";

const WALKING_SPEED_M_PER_MIN = 75;
const VERTICAL_EDGE_METERS = 5;

interface PathResult {
  nodeIds: string[];
  totalDistance: number;
}

export interface RouteProgressState {
  segmentIndex: number;
  segmentLocalProgress: number;
  floor: number;
  instructionIndex: number;
  distanceWalkedMeters: number;
}

function buildAdjacency(
  graph: NavigationGraph,
  accessibleOnly: boolean
): Map<string, Array<{ to: string; edge: NavEdge }>> {
  const adj = new Map<string, Array<{ to: string; edge: NavEdge }>>();

  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }

  for (const e of graph.edges) {
    if (e.restricted) continue;
    if (accessibleOnly && !e.wheelchairAccessible) continue;

    adj.get(e.from)?.push({ to: e.to, edge: e });
  }

  return adj;
}

function dijkstra(
  graph: NavigationGraph,
  startId: string,
  endId: string,
  accessibleOnly: boolean
): PathResult | null {
  const adj = buildAdjacency(graph, accessibleOnly);
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const node of graph.nodes) {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
  }
  distances.set(startId, 0);

  while (visited.size < graph.nodes.length) {
    let current: string | null = null;
    let minDist = Infinity;

    for (const [id, dist] of distances) {
      if (!visited.has(id) && dist < minDist) {
        minDist = dist;
        current = id;
      }
    }

    if (current === null || current === endId) break;
    visited.add(current);

    for (const { to, edge } of adj.get(current) ?? []) {
      const alt = minDist + edge.distanceMeters + (edge.vertical ? VERTICAL_EDGE_METERS : 0);
      if (alt < (distances.get(to) ?? Infinity)) {
        distances.set(to, alt);
        previous.set(to, current);
      }
    }
  }

  if ((distances.get(endId) ?? Infinity) === Infinity) return null;

  const nodeIds: string[] = [];
  let cursor: string | null = endId;
  while (cursor) {
    nodeIds.unshift(cursor);
    cursor = previous.get(cursor) ?? null;
  }

  return { nodeIds, totalDistance: distances.get(endId) ?? 0 };
}

function getEdge(graph: NavigationGraph, from: string, to: string): NavEdge | undefined {
  return graph.edges.find((e) => e.from === from && e.to === to);
}

function floorLabel(graph: NavigationGraph, floor: number): string {
  return graph.floorPlans.find((f) => f.floor === floor)?.label ?? `Floor ${floor}`;
}

function turnDirection(
  from: NavNode,
  via: NavNode,
  to: NavNode
): "straight" | "left" | "right" {
  const v1x = via.x - from.x;
  const v1y = via.y - from.y;
  const v2x = to.x - via.x;
  const v2y = to.y - via.y;
  const mag1 = Math.hypot(v1x, v1y);
  const mag2 = Math.hypot(v2x, v2y);
  if (mag1 < 1 || mag2 < 1) return "straight";

  const cross = v1x * v2y - v1y * v2x;
  const sinAngle = cross / (mag1 * mag2);
  if (Math.abs(sinAngle) < 0.28) return "straight";
  return sinAngle > 0 ? "left" : "right";
}

function edgeWeight(edge: NavEdge | undefined): number {
  if (!edge) return 0;
  return edge.distanceMeters + (edge.vertical ? VERTICAL_EDGE_METERS : 0);
}

function buildVoiceInstructions(
  graph: NavigationGraph,
  nodeIds: string[],
  destinationName: string,
  totalDistance: number
): { voiceInstructions: string[]; instructionProgress: number[] } {
  const voiceInstructions: string[] = [];
  const instructionProgress: number[] = [];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  if (nodeIds.length < 2 || totalDistance <= 0) {
    return { voiceInstructions, instructionProgress };
  }

  let walked = 0;

  const pushInstruction = (text: string, atDistance: number) => {
    voiceInstructions.push(text);
    instructionProgress.push(Math.max(0, Math.min(1, atDistance / totalDistance)));
  };

  const start = nodeMap.get(nodeIds[0]);
  if (start) {
    pushInstruction(
      start.locationId === "gf-kiosk"
        ? "You are at the Directory Kiosk. Follow the highlighted pink path."
        : `Start at the ${start.label}. Follow the highlighted path.`,
      0
    );
  }

  for (let i = 1; i < nodeIds.length; i++) {
    const prev = nodeMap.get(nodeIds[i - 1]);
    const curr = nodeMap.get(nodeIds[i]);
    const next = i < nodeIds.length - 1 ? nodeMap.get(nodeIds[i + 1]) : null;
    const edge = getEdge(graph, nodeIds[i - 1], nodeIds[i]);
    if (!prev || !curr) continue;

    const legStart = walked;
    walked += edgeWeight(edge);

    if (edge?.vertical) {
      const targetFloor = floorLabel(graph, curr.floor);
      pushInstruction(
        edge.instruction ?? `Take the ${curr.label} to ${targetFloor}.`,
        legStart
      );
      continue;
    }

    if (edge?.instruction) {
      pushInstruction(edge.instruction, legStart);
      continue;
    }

    const isDestination = i === nodeIds.length - 1 && curr.type === "room";

    if (isDestination) {
      if (edge && edge.distanceMeters >= 8) {
        pushInstruction(
          `Continue straight for about ${Math.round(edge.distanceMeters)} meters.`,
          legStart
        );
      }
      pushInstruction(`You have arrived at ${destinationName}.`, walked);
      continue;
    }

    if (next && (curr.landmark || curr.type === "intersection")) {
      const turn = turnDirection(prev, curr, next);
      if (turn === "left") {
        pushInstruction(`Turn left at the ${curr.label}.`, legStart);
        continue;
      }
      if (turn === "right") {
        pushInstruction(`Turn right at the ${curr.label}.`, legStart);
        continue;
      }
      if (curr.landmark && curr.type !== "intersection") {
        pushInstruction(`Continue past the ${curr.label}.`, legStart);
        continue;
      }
    }

    if (edge && edge.distanceMeters >= 12) {
      pushInstruction(
        `Walk straight for about ${Math.round(edge.distanceMeters)} meters.`,
        legStart
      );
    }
  }

  const last = voiceInstructions[voiceInstructions.length - 1] ?? "";
  if (!last.toLowerCase().includes("arrived")) {
    pushInstruction(`You have arrived at ${destinationName}.`, totalDistance);
  }

  return { voiceInstructions, instructionProgress };
}

function sameFloorCorridor(graph: NavigationGraph, node: NavNode): NavNode | undefined {
  for (const edge of graph.edges) {
    if (edge.vertical || edge.from !== node.id) continue;
    const other = graph.nodes.find((candidate) => candidate.id === edge.to);
    if (
      other &&
      other.floor === node.floor &&
      other.type !== "staircase" &&
      other.type !== "elevator"
    ) {
      return other;
    }
  }
  return undefined;
}

function splitIntoSegments(graph: NavigationGraph, nodeIds: string[]): NavigationSegment[] {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const segments: NavigationSegment[] = [];
  let currentFloor = nodeMap.get(nodeIds[0])?.floor ?? 1;
  let currentNodes: string[] = [nodeIds[0]];

  for (let i = 1; i < nodeIds.length; i++) {
    const node = nodeMap.get(nodeIds[i]);
    if (!node) continue;

    if (node.floor !== currentFloor) {
      // Keep a one-node landing. Dropping it skips that floor on the way up.
      if (currentNodes.length > 0) {
        segments.push(buildSegment(graph, currentFloor, currentNodes));
      }
      currentFloor = node.floor;
      currentNodes = [nodeIds[i]];
    } else {
      currentNodes.push(nodeIds[i]);
    }
  }

  if (currentNodes.length > 0) {
    segments.push(buildSegment(graph, currentFloor, currentNodes));
  }

  return segments;
}

function pushPathPoint(points: Array<{ x: number; y: number }>, point: { x: number; y: number }) {
  const last = points[points.length - 1];
  if (last && Math.hypot(last.x - point.x, last.y - point.y) < 1) return;
  // Mall-style L joins only — never a diagonal shortcut across the floor.
  if (last && Math.abs(last.x - point.x) > 2 && Math.abs(last.y - point.y) > 2) {
    points.push({ x: point.x, y: last.y });
  }
  points.push(point);
}

function buildSegment(graph: NavigationGraph, floor: number, nodeIds: string[]): NavigationSegment {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  let distance = 0;
  const instructions: string[] = [];

  for (let i = 1; i < nodeIds.length; i++) {
    const edge = getEdge(graph, nodeIds[i - 1], nodeIds[i]);
    distance += edge?.distanceMeters ?? 0;
    if (edge?.instruction) instructions.push(edge.instruction);
  }

  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < nodeIds.length; i++) {
    const node = nodeMap.get(nodeIds[i]);
    if (!node) continue;

    if (node.type === "staircase" && node.y < 320) {
      const prev = i > 0 ? nodeMap.get(nodeIds[i - 1]) : undefined;
      const next = i + 1 < nodeIds.length ? nodeMap.get(nodeIds[i + 1]) : undefined;
      const alongHall =
        prev && prev.type !== "staircase"
          ? prev
          : next && next.type !== "staircase"
            ? next
            : sameFloorCorridor(graph, node);
      const hallY = alongHall ? alongHall.y : node.y + 44;
      // Same-floor path that only passes the stair — stay on the hall, no zigzag into the flight.
      const walkPast =
        prev &&
        next &&
        prev.type !== "staircase" &&
        next.type !== "staircase";
      if (walkPast) {
        pushPathPoint(points, { x: node.x, y: hallY });
        continue;
      }
      const leavingThisFloor = Boolean(
        prev && prev.type !== "staircase" && (!next || next.type === "staircase")
      );
      // Approach on the ascending-flight column (not the stairwell middle).
      for (const point of stairHallApproachPlanPoints(node, graph, hallY, leavingThisFloor)) {
        pushPathPoint(points, point);
      }
      continue;
    }

    if (node.type === "elevator") {
      let corridorY: number | undefined;
      let corridorX: number | undefined;
      for (let step = 1; step < nodeIds.length && corridorY === undefined; step += 1) {
        for (const index of [i - step, i + step]) {
          const neighbor = nodeMap.get(nodeIds[index] ?? "");
          if (neighbor && neighbor.type !== "elevator" && neighbor.type !== "staircase") {
            corridorY = neighbor.y;
            break;
          }
        }
      }
      if (corridorY === undefined) {
        const corridor = sameFloorCorridor(graph, node);
        if (corridor) {
          corridorY = corridor.y;
          corridorX = corridor.x;
        }
      }
      const point = { x: node.x, y: corridorY ?? node.y };
      const prev = points[points.length - 1];
      const before = points[points.length - 2];
      if (
        prev &&
        before &&
        Math.abs(prev.y - point.y) < 3 &&
        Math.abs(before.y - point.y) < 3
      ) {
        const headingWest = before.x > prev.x;
        const backtracks = headingWest ? point.x > prev.x : point.x < prev.x;
        if (backtracks) points.pop();
      }
      // Stay on the hallway. Doubling back to the cab draws a notch in the guide.
      pushPathPoint(points, point);
      if (corridorX !== undefined && Math.abs(corridorX - point.x) > 8) {
        pushPathPoint(points, { x: corridorX, y: point.y });
      }
      continue;
    }

    const prev = points[points.length - 1];
    if (prev && (node.type === "room" || node.type === "facility")) {
      const door = officeDoorOnHallway(node.locationId);
      if (door) {
        // Stay on the hall spine to the door column, then step to the door stop.
        // Never pull the hall run onto the room wall (that draws the guide over masonry).
        pushPathPoint(points, { x: door.x, y: prev.y });
        pushPathPoint(points, door);
        continue;
      }
      if (Math.abs(prev.x - node.x) > 8 && Math.abs(prev.y - node.y) > 8) {
        pushPathPoint(points, { x: node.x, y: prev.y });
      }
    }

    pushPathPoint(points, { x: node.x, y: node.y });
  }

  if (nodeIds.length === 1 && distance === 0) {
    const only = nodeMap.get(nodeIds[0]);
    if (only && (only.type === "staircase" || only.type === "elevator")) {
      const corridor = sameFloorCorridor(graph, only);
      const edge = corridor ? getEdge(graph, only.id, corridor.id) : undefined;
      if (edge) distance = edge.distanceMeters;
    }
  }

  return {
    floor,
    nodeIds,
    points: routeAroundUpperHallWell(floor, points),
    distanceMeters: distance,
    instructions,
  };
}

/** Map overall route progress (0–1) to segment, floor, and active instruction. */
export function resolveRouteProgress(
  route: NavigationRoute,
  progress: number
): RouteProgressState {
  const clamped = Math.max(0, Math.min(1, progress));
  const segmentWeights = route.segments.map((s, i) => {
    const base = Math.max(s.distanceMeters, s.points.length > 1 ? 1 : 0);
    const next = route.segments[i + 1];
    const verticalGap =
      next && next.floor !== s.floor ? VERTICAL_EDGE_METERS : 0;
    return base + verticalGap;
  });
  const segmentTotal = segmentWeights.reduce((sum, w) => sum + w, 0) || 1;
  const walked = clamped * segmentTotal;

  let segmentIndex = route.segments.length - 1;
  let segmentLocalProgress = 1;
  let acc = 0;

  for (let i = 0; i < route.segments.length; i++) {
    const weight = segmentWeights[i];
    if (acc + weight >= walked || i === route.segments.length - 1) {
      segmentIndex = i;
      segmentLocalProgress = weight > 0 ? Math.max(0, Math.min(1, (walked - acc) / weight)) : 1;
      break;
    }
    acc += weight;
  }

  const segment = route.segments[segmentIndex];
  let instructionIndex = 0;
  for (let i = route.instructionProgress.length - 1; i >= 0; i--) {
    if (clamped >= route.instructionProgress[i] - 0.001) {
      instructionIndex = i;
      break;
    }
  }

  return {
    segmentIndex,
    segmentLocalProgress,
    floor: segment?.floor ?? route.segments[0]?.floor ?? 1,
    instructionIndex,
    distanceWalkedMeters: walked,
  };
}

/** Map overall route progress to local progress (0–1) along one floor's path segment. */
export function resolveFloorRouteProgress(
  route: NavigationRoute,
  progress: number,
  floor: number
): number {
  const state = resolveRouteProgress(route, progress);
  const floorSegmentIndex = route.segments.findIndex((s) => s.floor === floor);
  if (floorSegmentIndex < 0) return 0;
  if (floorSegmentIndex < state.segmentIndex) return 1;
  if (floorSegmentIndex > state.segmentIndex) return 0;
  return state.segmentLocalProgress;
}

export function calculateRoute(
  graph: NavigationGraph,
  fromNodeId: string,
  toNodeId: string,
  toLocationId: string,
  destinationName: string,
  options: { accessible?: boolean; isDemoMode?: boolean } = {}
): NavigationRoute | null {
  const accessible = options.accessible ?? false;

  let path = dijkstra(graph, fromNodeId, toNodeId, accessible);

  if (!path && accessible) {
    path = dijkstra(graph, fromNodeId, toNodeId, false);
  }

  if (!path) return null;

  const segments = splitIntoSegments(graph, path.nodeIds);
  const floorChanges = [
    ...new Set(path.nodeIds.map((id) => graph.nodes.find((n) => n.id === id)!.floor)),
  ];
  const { voiceInstructions, instructionProgress } = buildVoiceInstructions(
    graph,
    path.nodeIds,
    destinationName,
    path.totalDistance
  );

  return {
    fromNodeId,
    toNodeId,
    toLocationId,
    destinationName,
    segments,
    totalDistanceMeters: Math.round(path.totalDistance),
    estimatedMinutes: Math.max(1, Math.round(path.totalDistance / WALKING_SPEED_M_PER_MIN)),
    voiceInstructions,
    instructionProgress,
    floorChanges,
    isDemoMode: options.isDemoMode ?? false,
    usesGraph: true,
  };
}

export function getFullPathPoints(
  graph: NavigationGraph,
  route: NavigationRoute
): Array<{ floor: number; x: number; y: number }> {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const points: Array<{ floor: number; x: number; y: number }> = [];

  for (const segment of route.segments) {
    for (const nodeId of segment.nodeIds) {
      const node = nodeMap.get(nodeId);
      if (node) points.push({ floor: node.floor, x: node.x, y: node.y });
    }
  }

  return points;
}

export function interpolateAlongPath(
  points: Array<{ x: number; y: number }>,
  progress: number
): { x: number; y: number; segmentIndex: number } {
  if (points.length === 0) return { x: 0, y: 0, segmentIndex: 0 };
  if (points.length === 1) return { ...points[0], segmentIndex: 0 };

  const clamped = Math.max(0, Math.min(1, progress));
  const segments: number[] = [];
  let total = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segments.push(len);
    total += len;
  }

  if (total <= 0) return { ...points[0], segmentIndex: 0 };

  const target = clamped * total;
  let accumulated = 0;

  for (let i = 0; i < segments.length; i++) {
    if (accumulated + segments[i] >= target) {
      const t = segments[i] > 0 ? (target - accumulated) / segments[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
        segmentIndex: i,
      };
    }
    accumulated += segments[i];
  }

  return { ...points[points.length - 1], segmentIndex: segments.length - 1 };
}
