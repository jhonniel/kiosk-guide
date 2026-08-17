import type { NavigationGraph, NavNode } from "./types";

export function getNodeByLocationId(
  graph: NavigationGraph,
  locationId: string
): NavNode | undefined {
  return graph.nodes.find((n) => n.locationId === locationId);
}

export function getRoomNodesForFloor(graph: NavigationGraph, floor: number): NavNode[] {
  return graph.nodes.filter(
    (n) => n.floor === floor && (n.type === "room" || n.type === "facility")
  );
}

export function getLandmarkNodesForFloor(graph: NavigationGraph, floor: number): NavNode[] {
  return graph.nodes.filter((n) => n.floor === floor && n.landmark);
}
