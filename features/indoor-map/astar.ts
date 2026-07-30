import { walkingMinutes } from "./geo";
import type { IndoorNavEdgeRow, IndoorNavNodeRow, IndoorRouteResult, IndoorRouteSegment } from "./types";

type FloorMeta = {
  id: string;
  levelIndex: number;
  label: string;
};

type GraphInput = {
  nodes: IndoorNavNodeRow[];
  edges: IndoorNavEdgeRow[];
  floors: FloorMeta[];
  destinationRoomId?: string | null;
  destinationName: string;
  wheelchairOnly?: boolean;
};

function heuristic(a: IndoorNavNodeRow, b: IndoorNavNodeRow, metersPerPixel = 0.05): number {
  // Same-floor Euclidean; cross-floor add soft penalty
  const base = Math.hypot(b.x - a.x, b.y - a.y) * metersPerPixel;
  return a.floorId === b.floorId ? base : base + 5;
}

/**
 * A* pathfinding on indoor nav graph.
 * Edges are treated as bidirectional unless vertical-only one way is needed later.
 */
export function findIndoorRouteAStar(
  fromNodeId: string,
  toNodeId: string,
  input: GraphInput
): IndoorRouteResult | null {
  const nodeById = new Map(input.nodes.map((n) => [n.id, n]));
  const from = nodeById.get(fromNodeId);
  const to = nodeById.get(toNodeId);
  if (!from || !to) return null;

  const adj = new Map<string, Array<{ toId: string; edge: IndoorNavEdgeRow; cost: number }>>();
  const push = (a: string, b: string, edge: IndoorNavEdgeRow) => {
    if (input.wheelchairOnly && !edge.wheelchairAccessible) return;
    const list = adj.get(a) ?? [];
    const cost = edge.distanceMeters + (edge.vertical ? 5 : 0);
    list.push({ toId: b, edge, cost });
    adj.set(a, list);
  };
  for (const e of input.edges) {
    push(e.fromNodeId, e.toNodeId, e);
    push(e.toNodeId, e.fromNodeId, e);
  }

  const open = new Set<string>([fromNodeId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>([[fromNodeId, 0]]);
  const fScore = new Map<string, number>([[fromNodeId, heuristic(from, to)]]);

  while (open.size) {
    let current: string | null = null;
    let best = Infinity;
    for (const id of open) {
      const f = fScore.get(id) ?? Infinity;
      if (f < best) {
        best = f;
        current = id;
      }
    }
    if (!current) break;
    if (current === toNodeId) {
      return buildResult(current, cameFrom, nodeById, input);
    }
    open.delete(current);
    const gCurrent = gScore.get(current) ?? Infinity;
    for (const { toId, cost } of adj.get(current) ?? []) {
      const tentative = gCurrent + cost;
      if (tentative >= (gScore.get(toId) ?? Infinity)) continue;
      cameFrom.set(toId, current);
      gScore.set(toId, tentative);
      const nTo = nodeById.get(toId);
      if (!nTo) continue;
      fScore.set(toId, tentative + heuristic(nTo, to));
      open.add(toId);
    }
  }
  return null;
}

function buildResult(
  endId: string,
  cameFrom: Map<string, string>,
  nodeById: Map<string, IndoorNavNodeRow>,
  input: GraphInput
): IndoorRouteResult {
  const pathIds: string[] = [endId];
  let cur = endId;
  while (cameFrom.has(cur)) {
    cur = cameFrom.get(cur)!;
    pathIds.push(cur);
  }
  pathIds.reverse();

  const floorById = new Map(input.floors.map((f) => [f.id, f]));
  const segments: IndoorRouteSegment[] = [];
  let segNodeIds: string[] = [];
  let segPoints: Array<{ x: number; y: number }> = [];
  let segDist = 0;
  let currentFloorId: string | null = null;

  const flush = () => {
    if (!currentFloorId || segNodeIds.length < 1) return;
    const floor = floorById.get(currentFloorId);
    if (!floor) return;
    const instructions: string[] = [];
    if (segNodeIds.length >= 2) {
      instructions.push(`Walk along this floor toward ${input.destinationName}.`);
    }
    segments.push({
      floorId: currentFloorId,
      levelIndex: floor.levelIndex,
      floorLabel: floor.label,
      nodeIds: [...segNodeIds],
      points: [...segPoints],
      distanceMeters: segDist,
      instructions,
    });
  };

  for (let i = 0; i < pathIds.length; i++) {
    const node = nodeById.get(pathIds[i]!)!;
    if (currentFloorId === null) currentFloorId = node.floorId;
    if (node.floorId !== currentFloorId) {
      flush();
      const prev = nodeById.get(pathIds[i - 1]!);
      const prevFloor = prev ? floorById.get(prev.floorId) : null;
      const nextFloor = floorById.get(node.floorId);
      if (prevFloor && nextFloor) {
        segments.push({
          floorId: node.floorId,
          levelIndex: nextFloor.levelIndex,
          floorLabel: nextFloor.label,
          nodeIds: [prev!.id, node.id],
          points: [
            { x: prev!.x, y: prev!.y },
            { x: node.x, y: node.y },
          ],
          distanceMeters: 5,
          instructions: [
            `Take stairs/elevator from ${prevFloor.label} to ${nextFloor.label}.`,
          ],
        });
      }
      currentFloorId = node.floorId;
      segNodeIds = [node.id];
      segPoints = [{ x: node.x, y: node.y }];
      segDist = 0;
      continue;
    }
    if (segPoints.length) {
      const last = segPoints[segPoints.length - 1]!;
      segDist += Math.hypot(node.x - last.x, node.y - last.y) * 0.05;
    }
    segNodeIds.push(node.id);
    segPoints.push({ x: node.x, y: node.y });
  }
  flush();

  const totalDistanceMeters = segments.reduce((a, s) => a + s.distanceMeters, 0);
  const floorChanges = [
    ...new Set(
      segments
        .slice(1)
        .filter((s) => s.instructions.some((i) => /stairs|elevator/i.test(i)))
        .map((s) => s.floorId)
    ),
  ];

  return {
    fromNodeId: pathIds[0]!,
    toNodeId: endId,
    destinationRoomId: input.destinationRoomId ?? null,
    destinationName: input.destinationName,
    segments,
    totalDistanceMeters,
    estimatedMinutes: walkingMinutes(totalDistanceMeters),
    floorChanges,
  };
}
