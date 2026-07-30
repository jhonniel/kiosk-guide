import { findIndoorRouteAStar } from "../astar";
import type { IndoorNavEdgeRow, IndoorNavNodeRow } from "../types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const nodes: IndoorNavNodeRow[] = [
  { id: "a", floorId: "f1", type: "entrance", x: 0, y: 0, label: "A", roomId: null, wheelchairAccessible: true },
  { id: "b", floorId: "f1", type: "intersection", x: 100, y: 0, label: "B", roomId: null, wheelchairAccessible: true },
  { id: "c", floorId: "f1", type: "room", x: 100, y: 100, label: "C", roomId: "room-c", wheelchairAccessible: true },
  { id: "d", floorId: "f1", type: "intersection", x: 200, y: 0, label: "D", roomId: null, wheelchairAccessible: false },
];

const edges: IndoorNavEdgeRow[] = [
  { id: "e1", fromNodeId: "a", toNodeId: "b", distanceMeters: 5, wheelchairAccessible: true, vertical: false, verticalToFloorId: null, instruction: null },
  { id: "e2", fromNodeId: "b", toNodeId: "c", distanceMeters: 5, wheelchairAccessible: true, vertical: false, verticalToFloorId: null, instruction: null },
  { id: "e3", fromNodeId: "a", toNodeId: "d", distanceMeters: 1, wheelchairAccessible: false, vertical: false, verticalToFloorId: null, instruction: null },
  { id: "e4", fromNodeId: "d", toNodeId: "c", distanceMeters: 1, wheelchairAccessible: false, vertical: false, verticalToFloorId: null, instruction: null },
];

const floors = [{ id: "f1", levelIndex: 1, label: "Ground" }];

const short = findIndoorRouteAStar("a", "c", {
  nodes,
  edges,
  floors,
  destinationRoomId: "room-c",
  destinationName: "Room C",
  wheelchairOnly: false,
});

assert(short, "expected a route");
assert(short.fromNodeId === "a" && short.toNodeId === "c", "endpoints");
assert(short.totalDistanceMeters > 0, "distance");

const accessible = findIndoorRouteAStar("a", "c", {
  nodes,
  edges,
  floors,
  destinationName: "Room C",
  wheelchairOnly: true,
});
assert(accessible, "wheelchair route");
assert(
  accessible.segments.some((s) => s.nodeIds.includes("b")),
  "wheelchair path should prefer accessible corridor via B"
);

const missing = findIndoorRouteAStar("a", "missing", {
  nodes,
  edges,
  floors,
  destinationName: "X",
});
assert(missing === null, "missing destination returns null");

console.log("indoor-map astar tests passed");
