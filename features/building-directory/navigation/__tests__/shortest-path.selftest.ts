import { CAPITOL_GROUND_NAVIGATION_GRAPH } from "../capitol-ground-graph";
import { calculateRoute } from "../routing-engine";
import { getNodeByLocationId } from "../graph-helpers";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const graph = CAPITOL_GROUND_NAVIGATION_GRAPH;
const kiosk = getNodeByLocationId(graph, "gf-kiosk");
assert(kiosk, "kiosk node");

function routeTo(locationId: string) {
  const dest = getNodeByLocationId(graph, locationId);
  assert(dest, `missing ${locationId}`);
  const route = calculateRoute(graph, kiosk!.id, dest.id, locationId, dest.label);
  assert(route, `no route to ${locationId}`);
  return route;
}

function uses(route: NonNullable<ReturnType<typeof calculateRoute>>, part: string) {
  return route.segments.some((segment) => segment.nodeIds.some((id) => id.includes(part)));
}

const accounting = routeTo("f2-accounting");
assert(uses(accounting, "stair_b"), `east 2nd-floor office should use the east stairs: ${accounting.segments.flatMap((s) => s.nodeIds).join(" > ")}`);
assert(!uses(accounting, "elevator"), "east 2nd-floor office should not detour to the west elevators");

const viceGovernor = routeTo("f3-vice-governor");
assert(uses(viceGovernor, "stair_b"), `east 3rd-floor office should use the east stairs: ${viceGovernor.segments.flatMap((s) => s.nodeIds).join(" > ")}`);

const governor = routeTo("f2-governor");
assert(
  uses(governor, "elevator") || uses(governor, "stair_a"),
  `west 2nd-floor office should use the west elevator or central stairs: ${governor.segments.flatMap((s) => s.nodeIds).join(" > ")}`
);
assert(!uses(governor, "stair_b"), "west office should not walk to the east stairs");

const treasury = routeTo("gf-treasury");
assert(!uses(treasury, "hall_e"), `treasury should not overshoot to the east corridor: ${treasury.segments.flatMap((s) => s.nodeIds).join(" > ")}`);

const information = routeTo("f3-information");
assert(
  uses(information, "elevator") || uses(information, "stair_a"),
  `west 3rd-floor office should use the west side: ${information.segments.flatMap((s) => s.nodeIds).join(" > ")}`
);

console.log("shortest-path self-test ok");
console.log(
  [
    ["f2-accounting", accounting],
    ["f3-vice-governor", viceGovernor],
    ["f2-governor", governor],
    ["gf-treasury", treasury],
    ["f3-information", information],
  ]
    .map(([name, route]) => {
      const r = route as NonNullable<typeof accounting>;
      return `${name}: ${r.totalDistanceMeters}m via ${r.segments.flatMap((s) => s.nodeIds).join(" > ")}`;
    })
    .join("\n")
);
