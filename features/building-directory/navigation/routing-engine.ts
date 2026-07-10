import type {
  NavigationGraph,
  NavEdge,
  NavNode,
  NavigationRoute,
  NavigationSegment,
} from "./types";

const WALKING_SPEED_M_PER_MIN = 75;

interface PathResult {
  nodeIds: string[];
  totalDistance: number;
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
      const alt = minDist + edge.distanceMeters + (edge.vertical ? 5 : 0);
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

function turnDirection(from: NavNode, via: NavNode, to: NavNode): "straight" | "left" | "right" {
  const v1x = via.x - from.x;
  const v1y = via.y - from.y;
  const v2x = to.x - via.x;
  const v2y = to.y - via.y;
  const cross = v1x * v2y - v1y * v2x;
  if (Math.abs(cross) < 100) return "straight";
  return cross > 0 ? "left" : "right";
}

function buildVoiceInstructions(
  graph: NavigationGraph,
  nodeIds: string[],
  destinationLabel: string
): string[] {
  const instructions: string[] = [];
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  if (nodeIds.length < 2) return instructions;

  instructions.push("Walk straight from the Main Entrance.");

  for (let i = 1; i < nodeIds.length; i++) {
    const prev = nodeMap.get(nodeIds[i - 1]);
    const curr = nodeMap.get(nodeIds[i]);
    const edge = getEdge(graph, nodeIds[i - 1], nodeIds[i]);
    if (!prev || !curr) continue;

    if (edge?.vertical) {
      instructions.push(edge.instruction ?? `Proceed to the ${curr.label}.`);
      continue;
    }

    if (edge?.instruction) {
      instructions.push(edge.instruction);
      continue;
    }

    if (curr.landmark && curr.type !== "room") {
      if (i < nodeIds.length - 1) {
        const next = nodeMap.get(nodeIds[i + 1]);
        if (next) {
          const turn = turnDirection(prev, curr, next);
          if (turn === "left") {
            instructions.push(`Turn left at the ${curr.label}.`);
          } else if (turn === "right") {
            instructions.push(`Turn right at the ${curr.label}.`);
          } else {
            instructions.push(`Continue past the ${curr.label}.`);
          }
          continue;
        }
      }
    }

    if (curr.type === "room") {
      const dist = edge?.distanceMeters ?? 0;
      if (dist > 0) {
        instructions.push(`Walk straight for approximately ${Math.round(dist)} meters.`);
      }
      instructions.push(`${curr.label} (${destinationLabel}) is on your ${i % 2 === 0 ? "right" : "left"}.`);
    }
  }

  instructions.push("You have arrived at your destination.");
  return [...new Set(instructions)];
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
      segments.push(buildSegment(graph, currentFloor, currentNodes));
      currentFloor = node.floor;
      currentNodes = [nodeIds[i - 1], nodeIds[i]];
    } else {
      currentNodes.push(nodeIds[i]);
    }
  }

  if (currentNodes.length > 1) {
    segments.push(buildSegment(graph, currentFloor, currentNodes));
  }

  return segments;
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

  return {
    floor,
    nodeIds,
    points: nodeIds.map((id) => {
      const n = nodeMap.get(id)!;
      return { x: n.x, y: n.y };
    }),
    distanceMeters: distance,
    instructions,
  };
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
  const floorChanges = [...new Set(path.nodeIds.map((id) => graph.nodes.find((n) => n.id === id)!.floor))];

  return {
    fromNodeId,
    toNodeId,
    toLocationId,
    destinationName,
    segments,
    totalDistanceMeters: Math.round(path.totalDistance),
    estimatedMinutes: Math.max(1, Math.round(path.totalDistance / WALKING_SPEED_M_PER_MIN)),
    voiceInstructions: buildVoiceInstructions(graph, path.nodeIds, destinationName),
    floorChanges,
    isDemoMode: options.isDemoMode ?? true,
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

  const target = clamped * total;
  let accumulated = 0;

  for (let i = 0; i < segments.length; i++) {
    if (accumulated + segments[i] >= target) {
      const t = (target - accumulated) / segments[i];
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
