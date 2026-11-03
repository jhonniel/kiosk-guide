import { officeDoorOnHallway } from "./building-3d";
import type { NavigationGraph, NavEdge, NavNode } from "./types";

/** Capitol plan pixels to walking meters. Hall runs stay in the same units Dijkstra uses. */
const METERS_PER_PIXEL = 0.1;

function manhattanMeters(a: { x: number; y: number }, b: { x: number; y: number }) {
  return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) * METERS_PER_PIXEL;
}

/** Where a visitor actually walks for this node — the door stop for offices. */
export function walkPoint(node: NavNode): { x: number; y: number } {
  if (node.type === "room" || node.type === "facility") {
    const door = officeDoorOnHallway(node.locationId);
    if (door) return door;
  }
  return { x: node.x, y: node.y };
}

function isHallNode(node: NavNode) {
  return node.type === "intersection";
}

function needsHallLink(node: NavNode) {
  return (
    node.type === "room" ||
    node.type === "facility" ||
    node.type === "staircase" ||
    node.type === "elevator"
  );
}

function linkAccessible(from: NavNode, to: NavNode) {
  return from.wheelchairAccessible !== false && to.wheelchairAccessible !== false;
}

/**
 * Rebuild walking costs from the floor-plan coordinates and attach every office,
 * stair, and elevator to the corridor. Dijkstra then uses the shortest real walk,
 * including the closest stair or elevator to the destination.
 */
export function prepareShortestPathGraph(graph: NavigationGraph): NavigationGraph {
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
  const hallsByFloor = new Map<number, NavNode[]>();

  for (const node of graph.nodes) {
    if (!isHallNode(node)) continue;
    const halls = hallsByFloor.get(node.floor) ?? [];
    halls.push(node);
    hallsByFloor.set(node.floor, halls);
  }

  const edges: NavEdge[] = graph.edges.map((edge) => {
    if (edge.vertical) return { ...edge };
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to || from.floor !== to.floor) return { ...edge };
    return {
      ...edge,
      distanceMeters: Math.max(0.5, manhattanMeters(walkPoint(from), walkPoint(to))),
    };
  });

  const seen = new Set(edges.map((edge) => `${edge.from}->${edge.to}`));

  const addWalk = (from: NavNode, to: NavNode) => {
    const key = `${from.id}->${to.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({
      from: from.id,
      to: to.id,
      distanceMeters: Math.max(0.5, manhattanMeters(walkPoint(from), walkPoint(to))),
      wheelchairAccessible: linkAccessible(from, to),
      restricted: false,
      vertical: false,
    });
  };

  for (const node of graph.nodes) {
    if (!needsHallLink(node)) continue;
    for (const hall of hallsByFloor.get(node.floor) ?? []) {
      addWalk(node, hall);
      addWalk(hall, node);
    }
  }

  return { ...graph, edges };
}
