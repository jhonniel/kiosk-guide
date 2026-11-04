import type { NavigationGraph, NavNode } from "./types";

export function getNodeByLocationId(
  graph: NavigationGraph,
  locationId: string
): NavNode | undefined {
  return graph.nodes.find((n) => n.locationId === locationId);
}

const RESTROOM_PATTERN = /comfort[-_ ]?room|restroom|toilet/i;

/** Only offices and comfort rooms can be navigation destinations — never elevators or stairs. */
export function isNavigationDestination(node: NavNode | undefined | null): boolean {
  if (!node) return false;
  if (node.type === "room") return true;
  if (node.type === "facility") {
    return RESTROOM_PATTERN.test(`${node.locationId ?? ""} ${node.label}`);
  }
  return false;
}

export function isNavigableLocation(graph: NavigationGraph, locationId: string): boolean {
  return isNavigationDestination(getNodeByLocationId(graph, locationId));
}

export function getRoomNodesForFloor(graph: NavigationGraph, floor: number): NavNode[] {
  return graph.nodes.filter(
    (n) => n.floor === floor && (n.type === "room" || n.type === "facility")
  );
}

export function getLandmarkNodesForFloor(graph: NavigationGraph, floor: number): NavNode[] {
  return graph.nodes.filter((n) => n.floor === floor && n.landmark);
}
