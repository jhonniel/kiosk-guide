import type { OrthographicCamera } from "three";
import type { FloorPlanConfig, NavigationGraph, NavigationRoute, NavNode } from "./types";

export const FLOOR_HEIGHT = 4.2;
/** Default schematic scale (demo academic building ~620×360). */
export const PLAN_SCALE = 0.1;
/** Target world-space size for image-based floor plans (longest side). */
export const IMAGE_PLAN_TARGET = 72;

export const KIOSK_LOCATION = {
  floor: 1,
  x: 500,
  y: 360,
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
      return { w: 4.0, d: 2.1, h: WALL_HEIGHT * 0.55 };
    case "entrance":
      return { w: 4, d: 2, h: WALL_HEIGHT * 0.6 };
    case "emergency_exit":
      return { w: 3.5, d: 2.5, h: WALL_HEIGHT * 0.7 };
    default:
      return { w: 2, d: 2, h: 1.2 };
  }
}

/** Footprint matched to stairwell graphics on the capitol floor plan (plan px × scale). */
export function nodeStairwellFootprint(
  node: NavNode,
  graph?: NavigationGraph
): { w: number; d: number; h: number } {
  const scale = graph ? getPlanScale(graph, node.floor) : PLAN_SCALE;
  const pad = 1.12;
  // South-corridor stairwell (tall symbol along the entrance leg).
  if (node.y >= 320) {
    return { w: 82 * scale * pad, d: 118 * scale * pad, h: 0.08 };
  }
  // Corridor stair symbol is about 51×41 plan pixels (the full U-shaped line).
  return { w: 51 * scale * pad, d: 41 * scale * pad, h: 0.08 };
}

function capitolStairLayout(node: NavNode, graph: NavigationGraph) {
  const { w, d } = nodeStairwellFootprint(node, graph);
  const scale = getPlanScale(graph, node.floor);
  const alongX = node.y < 320;
  const flipped = /stair[-_]b/.test(`${node.id} ${node.locationId ?? ""}`);
  const length = alongX ? w : d;
  const span = alongX ? d : w;
  const steps = 6;
  const flightLen = length * 0.7;
  const landingLen = length * 0.3;
  const flightSpan = span * 0.42;
  const well = Math.max(span - flightSpan * 2, span * 0.12);
  const treadRun = flightLen / steps;
  const rise = Math.max(0.14, length * 0.045);
  const totalRise = steps * rise;
  // Going-up flight (ImagePlanStairwell side > 0).
  const across = well / 2 + flightSpan / 2;
  const footAlong = -length / 2 + treadRun * 0.5;
  const landAlong = length / 2 - landingLen / 2;
  const directedFoot = flipped ? -footAlong : footAlong;
  return {
    scale,
    alongX,
    flipped,
    length,
    span,
    steps,
    treadRun,
    rise,
    totalRise,
    landingLen,
    across,
    footAlong,
    landAlong,
    directedFoot,
  };
}

/**
 * Hallway → stair mouth (center) → flight foot. Axis-aligned only.
 * Enter at the opening, then step onto the ascending flight — never run
 * beside the stair box on the hall, and never cut a diagonal shortcut.
 */
export function stairHallApproachPlanPoints(
  node: NavNode,
  graph: NavigationGraph,
  hallY: number,
  leaving: boolean
): Array<{ x: number; y: number }> {
  const { scale, alongX, directedFoot, across } = capitolStairLayout(node, graph);

  if (alongX) {
    const footX = node.x + directedFoot / scale;
    const footY = node.y + across / scale;
    // Mouth sits on the hall-facing flight, just south of the first tread.
    const mouthY = Math.min(hallY - 6, footY + 10);
    const onHall = { x: node.x, y: hallY };
    const atMouth = { x: node.x, y: mouthY };
    const atFoot = { x: footX, y: footY };
    return leaving ? [onHall, atMouth, atFoot] : [atFoot, atMouth, onHall];
  }

  const footY = node.y + directedFoot / scale;
  const footX = node.x + across / scale;
  const mouthX = Math.min(hallY - 6, footX + 10);
  const onHall = { x: hallY, y: node.y };
  const atMouth = { x: mouthX, y: node.y };
  const atFoot = { x: footX, y: footY };
  return leaving ? [onHall, atMouth, atFoot] : [atFoot, atMouth, onHall];
}

/**
 * Guide line on the ascending flight (same side as ImagePlanStairwell side > 0),
 * from the first tread up to the landing — not down the stairwell center.
 */
export function stairTreadGuidePoints(
  node: NavNode,
  graph: NavigationGraph
): [number, number, number][] {
  const origin = map2DToFloorPlan3D(node.x, node.y, graph, node.floor);
  const {
    alongX,
    flipped,
    steps,
    treadRun,
    rise,
    totalRise,
    across,
    footAlong,
    landAlong,
  } = capitolStairLayout(node, graph);
  // Sit above the tread top so the guide is not buried under the stair mesh.
  const clearance = 0.34;

  const toWorld = (along: number, y: number): [number, number, number] => {
    const directed = flipped ? -along : along;
    if (alongX) return [origin.x + directed, y, origin.z + across];
    return [origin.x + across, y, origin.z + directed];
  };

  // One point per tread so the guide climbs the flight instead of cutting flat beside it.
  const points: [number, number, number][] = [];
  for (let i = 0; i < steps; i += 1) {
    const along = footAlong + treadRun * i;
    if (node.floor >= 3) {
      points.push(toWorld(along, -rise * i + clearance));
    } else {
      points.push(toWorld(along, rise * (i + 1) + clearance));
    }
  }
  points.push(
    node.floor >= 3
      ? toWorld(landAlong, -totalRise + clearance)
      : toWorld(landAlong, totalRise + clearance)
  );
  return points;
}

/**
 * Open center of the green hallway on the 2nd and 3rd floors, between the stairs.
 * Routes stay on the green to either side of this rectangle.
 */
export const CAPITOL_UPPER_HALL_WELL = {
  x0: 369,
  y0: 225,
  x1: 648,
  y1: 271,
} as const;

/** Keep a walking line off the open well. Returns the original points on the ground floor. */
export function routeAroundUpperHallWell(
  floor: number,
  points: Array<{ x: number; y: number }>
): Array<{ x: number; y: number }> {
  if ((floor !== 2 && floor !== 3) || points.length < 2) return points;

  const well = CAPITOL_UPPER_HALL_WELL;
  // Middle of the green south of the opening. The hall spine at 292 sits on the lip.
  const southLane = well.y1 + 39;
  // North of the opening, on the green in front of the rooms. Not on the lip of the cut.
  const northClearY = well.y0 - 35;
  // Beside the stairs, where the green runs through. Not on the stair edge.
  const westGap = 290;
  const eastGap = 730;
  const inside = (point: { x: number; y: number }) =>
    point.x > well.x0 && point.x < well.x1 && point.y > well.y0 && point.y < well.y1;

  const crosses = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    if (inside(a) || inside(b)) return true;
    const steps = 12;
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      if (inside({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })) return true;
    }
    return false;
  };

  const laneY = (point: { x: number; y: number }) => {
    if (point.y > (well.y0 + well.y1) / 2) return southLane;
    return point.y <= northClearY ? point.y : northClearY;
  };

  const out = [points[0]];
  for (let i = 1; i < points.length; i += 1) {
    const prev = out[out.length - 1];
    const next = points[i];
    if (!crosses(prev, next)) {
      out.push(next);
      continue;
    }

    const leftCost = Math.abs(prev.x - westGap) + Math.abs(next.x - westGap);
    const rightCost = Math.abs(prev.x - eastGap) + Math.abs(next.x - eastGap);
    const gapX = leftCost <= rightCost ? westGap : eastGap;
    const extras = [
      { x: prev.x, y: laneY(prev) },
      { x: gapX, y: laneY(prev) },
      { x: gapX, y: laneY(next) },
      { x: next.x, y: laneY(next) },
      next,
    ];
    for (const point of extras) {
      const last = out[out.length - 1];
      if (last && Math.hypot(last.x - point.x, last.y - point.y) < 1) continue;
      out.push(point);
    }
  }

  return pullHallOffOpening(out, well, northClearY);
}

/** Move hall points that sit on the lip of the opening into the middle of the green. */
function pullHallOffOpening(
  points: Array<{ x: number; y: number }>,
  well: { x0: number; y0: number; x1: number; y1: number },
  northClearY: number
): Array<{ x: number; y: number }> {
  const southLane = well.y1 + 39;
  const shifted = points.map((point) => {
    const beside = point.x > well.x0 && point.x < well.x1;
    if (!beside) return point;
    if (point.y > well.y1 && point.y < southLane) return { x: point.x, y: southLane };
    if (point.y < well.y0 && point.y > northClearY) return { x: point.x, y: northClearY };
    return point;
  });

  const out = [shifted[0]];
  const push = (point: { x: number; y: number }) => {
    const last = out[out.length - 1];
    if (last && Math.hypot(last.x - point.x, last.y - point.y) < 1) return;
    out.push(point);
  };

  for (let i = 1; i < shifted.length; i += 1) {
    const a = out[out.length - 1];
    const b = shifted[i];
    const onSouth = a.y > well.y1 && a.y < southLane && b.y > well.y1 && b.y < southLane;
    const overlaps = Math.min(a.x, b.x) < well.x1 && Math.max(a.x, b.x) > well.x0;
    if (onSouth && overlaps && Math.abs(a.y - b.y) < 4) {
      const goingRight = b.x >= a.x;
      const enterX = goingRight ? well.x0 : well.x1;
      const exitX = goingRight ? well.x1 : well.x0;
      if ((goingRight && a.x < well.x0 && b.x > well.x1) || (!goingRight && a.x > well.x1 && b.x < well.x0)) {
        push({ x: enterX, y: a.y });
        push({ x: enterX, y: southLane });
        push({ x: exitX, y: southLane });
        push({ x: exitX, y: b.y });
      }
    }
    push(b);
  }

  return out;
}

/** West edge of the green capitol corridor. West of this is white floor. */
const CAPITOL_GREEN_HALL_X0 = 148;
/** Main corridor spine on every floor. */
const CAPITOL_HALL_Y = 292;
/** Plan pixels in front of the door threshold. Close enough to meet the door, still outside the wall. */
const OFFICE_DOOR_CLEARANCE = 14;
/** Half the glass door width plus the guide line, in plan pixels. */
const OFFICE_DOOR_HALF = 16;

/**
 * Plan x-spans between the hallway and the offices that a walk to a door cannot cross.
 * North-wing doors are reached past the elevators and stairwells; the PDRRMO block
 * (CPMC / Conference Room upstairs) sits in front of both the Health and Tourism corners.
 */
const CAPITOL_DOOR_BLOCKERS: Record<"north" | "south", Array<[number, number]>> = {
  north: [
    [186, 221],
    [303.5, 360.5],
    [656.5, 713.5],
    [793, 876],
  ],
  south: [[793, 876]],
};

export type OfficeDoorPlan = {
  /** Wall of the room that holds the door (it faces the hallway). */
  side: "north" | "south" | "west" | "east";
  /** Center of the door opening on that wall, in plan pixels. */
  x: number;
  y: number;
  /** Door position along the wall, from -0.5 (west/north end) to 0.5 (east/south end). */
  along: number;
};

/**
 * Where the office door sits on its hall-facing wall.
 * The 3D glass door and the navigation stop both use this, so the guide ends at the door.
 */
export function officeDoorPlan(locationId: string | undefined): OfficeDoorPlan | null {
  const column = locationId ? CAPITOL_ROOM_COLUMNS[locationId] : undefined;
  if (!column) return null;
  // Comfort rooms are entered from the open green spur, not through a door.
  if (column.x1 <= CAPITOL_GREEN_HALL_X0 + 2) return null;

  const northWing = column.y1 < CAPITOL_HALL_Y - 24;
  const southWing = column.y0 > CAPITOL_HALL_Y + 24;
  if (!northWing && !southWing) {
    const y = (column.y0 + column.y1) / 2;
    return { side: "west", x: column.x0, y, along: 0 };
  }

  const center = (column.x0 + column.x1) / 2;
  const lo = Math.max(column.x0 + OFFICE_DOOR_HALF, CAPITOL_GREEN_HALL_X0 + 12);
  const hi = column.x1 - OFFICE_DOOR_HALF;
  const blocked = CAPITOL_DOOR_BLOCKERS[northWing ? "north" : "south"].map(
    ([a, b]) => [a - OFFICE_DOOR_HALF, b + OFFICE_DOOR_HALF] as const
  );
  const isOpen = (x: number) => x >= lo && x <= hi && !blocked.some(([a, b]) => x > a && x < b);
  const candidates = [center, lo, hi, ...blocked.flat()].filter(isOpen);
  const x = candidates.length
    ? candidates.reduce((best, c) => (Math.abs(c - center) < Math.abs(best - center) ? c : best))
    : Math.min(Math.max(center, lo), hi);

  return {
    side: northWing ? "south" : "north",
    x,
    y: northWing ? column.y1 : column.y0,
    along: (x - center) / Math.max(column.x1 - column.x0, 1),
  };
}

/**
 * Point on the green hallway just outside an office door.
 * The guide stops here so it does not cross white floor or enter the room.
 */
export function officeDoorOnHallway(locationId: string | undefined): { x: number; y: number } | null {
  const column = locationId ? CAPITOL_ROOM_COLUMNS[locationId] : undefined;
  if (!column) return null;

  // The comfort room is a short spur west of the main hallway.
  if (column.x1 <= CAPITOL_GREEN_HALL_X0 + 2) {
    return {
      x: Math.min(column.x1 + 6, CAPITOL_GREEN_HALL_X0 + 4),
      y: (column.y0 + column.y1) / 2,
    };
  }

  const door = officeDoorPlan(locationId);
  if (!door) return null;
  switch (door.side) {
    case "south":
      return { x: door.x, y: door.y + OFFICE_DOOR_CLEARANCE };
    case "north":
      return { x: door.x, y: door.y - OFFICE_DOOR_CLEARANCE };
    case "west":
      return { x: door.x - OFFICE_DOOR_CLEARANCE, y: door.y };
    case "east":
      return { x: door.x + OFFICE_DOOR_CLEARANCE, y: door.y };
  }
}

/** Room columns measured from the black outlines on the capitol ground-floor plan. */
const CAPITOL_ROOM_COLUMNS: Record<string, { x0: number; y0: number; x1: number; y1: number }> = {
  "gf-veterinary": { x0: 60, y0: 40, x1: 221, y1: 167 },
  "gf-agriculture": { x0: 224, y0: 39, x1: 385, y1: 167 },
  "gf-general-services": { x0: 388, y0: 38, x1: 548, y1: 166 },
  "gf-budget": { x0: 550, y0: 37, x1: 711, y1: 165 },
  "gf-health": { x0: 714, y0: 36, x1: 876, y1: 164 },
  "gf-social-welfare": { x0: 59, y0: 330, x1: 222, y1: 519 },
  "gf-assessor": { x0: 224, y0: 330, x1: 386, y1: 519 },
  "gf-people-assistance": { x0: 388, y0: 330, x1: 467, y1: 457 },
  "gf-treasury": { x0: 551, y0: 328, x1: 712, y1: 456 },
  "gf-tourism": { x0: 715, y0: 327, x1: 876, y1: 455 },
  "gf-conference": { x0: 793, y0: 205, x1: 876, y1: 325 },
  "gf-comfort-room": { x0: 59, y0: 206, x1: 142, y1: 291 },
  "f2-comfort-room": { x0: 59, y0: 206, x1: 142, y1: 291 },
  "f3-comfort-room": { x0: 59, y0: 206, x1: 142, y1: 291 },
};

const UPPER_OFFICE_COLUMN_SOURCES = [
  "gf-veterinary",
  "gf-agriculture",
  "gf-general-services",
  "gf-budget",
  "gf-health",
  "gf-conference",
  "gf-social-welfare",
  "gf-assessor",
  "gf-people-assistance",
  "gf-treasury",
  "gf-tourism",
] as const;

for (const prefix of ["f2", "f3"] as const) {
  UPPER_OFFICE_COLUMN_SOURCES.forEach((sourceId, index) => {
    CAPITOL_ROOM_COLUMNS[`${prefix}-office-${index + 1}`] = {
      ...CAPITOL_ROOM_COLUMNS[sourceId],
    };
  });
}

/** Second-floor offices 7 and 8 are separate rooms again. */
const f2Office7 = CAPITOL_ROOM_COLUMNS["f2-office-7"];
const f2Office8 = CAPITOL_ROOM_COLUMNS["f2-office-8"];
CAPITOL_ROOM_COLUMNS["f2-governor"] = { ...f2Office7 };
CAPITOL_ROOM_COLUMNS["f2-administrator"] = { ...f2Office8 };
delete CAPITOL_ROOM_COLUMNS["f2-office-7"];
delete CAPITOL_ROOM_COLUMNS["f2-office-8"];

/** Second-floor office 9 is the Congressman Office. The empty bay beside it is the Legal Department. */
const f2Office9 = CAPITOL_ROOM_COLUMNS["f2-office-9"];
CAPITOL_ROOM_COLUMNS["f2-admin"] = {
  x0: f2Office9.x0,
  y0: f2Office9.y0,
  x1: f2Office9.x1,
  y1: f2Office9.y1,
};
CAPITOL_ROOM_COLUMNS["f2-legal"] = {
  x0: f2Office9.x1 + 2,
  y0: f2Office9.y0,
  x1: 550,
  y1: f2Office9.y1,
};
delete CAPITOL_ROOM_COLUMNS["f2-office-9"];

/**
 * Second-floor office 10 splits into two rooms.
 * The west half is Environment and Natural Resources; the east half is Bids and Award.
 */
const f2Office10 = CAPITOL_ROOM_COLUMNS["f2-office-10"];
const f2Office10Mid = Math.round((f2Office10.x0 + f2Office10.x1) / 2);
CAPITOL_ROOM_COLUMNS["f2-environment"] = {
  x0: f2Office10.x0,
  y0: f2Office10.y0,
  x1: f2Office10Mid - 1,
  y1: f2Office10.y1,
};
CAPITOL_ROOM_COLUMNS["f2-bac"] = {
  x0: f2Office10Mid + 1,
  y0: f2Office10.y0,
  x1: f2Office10.x1,
  y1: f2Office10.y1,
};
delete CAPITOL_ROOM_COLUMNS["f2-office-10"];

/** Second-floor office 11 is the Accounting Department. */
CAPITOL_ROOM_COLUMNS["f2-accounting"] = { ...CAPITOL_ROOM_COLUMNS["f2-office-11"] };
delete CAPITOL_ROOM_COLUMNS["f2-office-11"];

/** Second-floor office 6 keeps its footprint and is labeled Conference Room. */
CAPITOL_ROOM_COLUMNS["f2-conference"] = { ...CAPITOL_ROOM_COLUMNS["f2-office-6"] };
delete CAPITOL_ROOM_COLUMNS["f2-office-6"];

/** Second-floor offices 1, 2, and 5 keep their footprints under new names. */
CAPITOL_ROOM_COLUMNS["f2-engineering"] = { ...CAPITOL_ROOM_COLUMNS["f2-office-1"] };
CAPITOL_ROOM_COLUMNS["f2-peso"] = { ...CAPITOL_ROOM_COLUMNS["f2-office-2"] };
CAPITOL_ROOM_COLUMNS["f2-audit"] = { ...CAPITOL_ROOM_COLUMNS["f2-office-5"] };
delete CAPITOL_ROOM_COLUMNS["f2-office-1"];
delete CAPITOL_ROOM_COLUMNS["f2-office-2"];
delete CAPITOL_ROOM_COLUMNS["f2-office-5"];

/** Second-floor offices 3 and 4 are one room: Provincial Planning Development Department. */
const f2Office3 = CAPITOL_ROOM_COLUMNS["f2-office-3"];
const f2Office4 = CAPITOL_ROOM_COLUMNS["f2-office-4"];
CAPITOL_ROOM_COLUMNS["f2-planning"] = {
  x0: Math.min(f2Office3.x0, f2Office4.x0),
  y0: Math.min(f2Office3.y0, f2Office4.y0),
  x1: Math.max(f2Office3.x1, f2Office4.x1),
  y1: Math.max(f2Office3.y1, f2Office4.y1),
};
delete CAPITOL_ROOM_COLUMNS["f2-office-3"];
delete CAPITOL_ROOM_COLUMNS["f2-office-4"];

/** Third-floor north offices keep their footprints under new names. */
CAPITOL_ROOM_COLUMNS["f3-information"] = { ...CAPITOL_ROOM_COLUMNS["f3-office-1"] };
CAPITOL_ROOM_COLUMNS["f3-sanggunian"] = { ...CAPITOL_ROOM_COLUMNS["f3-office-2"] };
CAPITOL_ROOM_COLUMNS["f3-secretariat"] = { ...CAPITOL_ROOM_COLUMNS["f3-office-3"] };
CAPITOL_ROOM_COLUMNS["f3-session"] = { ...CAPITOL_ROOM_COLUMNS["f3-office-4"] };
CAPITOL_ROOM_COLUMNS["f3-vice-governor"] = { ...CAPITOL_ROOM_COLUMNS["f3-office-5"] };
delete CAPITOL_ROOM_COLUMNS["f3-office-1"];
delete CAPITOL_ROOM_COLUMNS["f3-office-2"];
delete CAPITOL_ROOM_COLUMNS["f3-office-3"];
delete CAPITOL_ROOM_COLUMNS["f3-office-4"];
delete CAPITOL_ROOM_COLUMNS["f3-office-5"];

/** Third-floor office 6 keeps its footprint and is labeled CPMC. */
CAPITOL_ROOM_COLUMNS["f3-cpmc"] = { ...CAPITOL_ROOM_COLUMNS["f3-office-6"] };
delete CAPITOL_ROOM_COLUMNS["f3-office-6"];

/** Third-floor offices 7 and 8 are one room: Multi-Purpose Hall. */
const f3Office7 = CAPITOL_ROOM_COLUMNS["f3-office-7"];
const f3Office8 = CAPITOL_ROOM_COLUMNS["f3-office-8"];
CAPITOL_ROOM_COLUMNS["f3-multipurpose"] = {
  x0: Math.min(f3Office7.x0, f3Office8.x0),
  y0: Math.min(f3Office7.y0, f3Office8.y0),
  x1: Math.max(f3Office7.x1, f3Office8.x1),
  y1: Math.max(f3Office7.y1, f3Office8.y1),
};
delete CAPITOL_ROOM_COLUMNS["f3-office-7"];
delete CAPITOL_ROOM_COLUMNS["f3-office-8"];

/** Third-floor offices 9, 10, and 11 are one room: Archive. */
const f3Office9 = CAPITOL_ROOM_COLUMNS["f3-office-9"];
const f3Office10 = CAPITOL_ROOM_COLUMNS["f3-office-10"];
const f3Office11 = CAPITOL_ROOM_COLUMNS["f3-office-11"];
CAPITOL_ROOM_COLUMNS["f3-archive"] = {
  x0: Math.min(f3Office9.x0, f3Office10.x0, f3Office11.x0),
  // Same hallway line as the multi-purpose hall, so the corner does not step.
  y0: CAPITOL_ROOM_COLUMNS["f3-multipurpose"].y0,
  x1: Math.max(f3Office9.x1, f3Office10.x1, f3Office11.x1),
  y1: Math.max(f3Office9.y1, f3Office10.y1, f3Office11.y1),
};
delete CAPITOL_ROOM_COLUMNS["f3-office-9"];
delete CAPITOL_ROOM_COLUMNS["f3-office-10"];
delete CAPITOL_ROOM_COLUMNS["f3-office-11"];

/** Elevator bank outline on the capitol plan. The two cabs split that black rectangle. */
const CAPITOL_ELEVATOR_COLUMNS: Record<string, { x0: number; y0: number; x1: number; y1: number }> = {
  "gf-elevator-1": { x0: 186, y0: 208, x1: 221, y1: 251 },
  "gf-elevator-2": { x0: 186, y0: 251, x1: 221, y1: 276 },
  "f2-elevator-1": { x0: 186, y0: 208, x1: 221, y1: 251 },
  "f2-elevator-2": { x0: 186, y0: 251, x1: 221, y1: 276 },
  "f3-elevator-1": { x0: 186, y0: 208, x1: 221, y1: 251 },
  "f3-elevator-2": { x0: 186, y0: 251, x1: 221, y1: 276 },
};

export function imagePlanElevatorColumn(
  node: NavNode,
  graph: NavigationGraph
): { x: number; y: number; w: number; d: number; h: number } | null {
  const column = node.locationId ? CAPITOL_ELEVATOR_COLUMNS[node.locationId] : undefined;
  if (!column) return null;
  const inset = 0;
  const scale = getPlanScale(graph, node.floor);
  return {
    x: (column.x0 + column.x1) / 2,
    y: (column.y0 + column.y1) / 2,
    w: Math.max(column.x1 - column.x0 - inset * 2, 4) * scale,
    d: Math.max(column.y1 - column.y0 - inset * 2, 8) * scale,
    h: 1.05,
  };
}

export type ImagePlanRoomPart = {
  position: [number, number, number];
  size: [number, number, number];
  door: boolean;
};

/**
 * One comfort room wrapping the green spur.
 * The spur itself stays hallway, so the parts only meet west of it.
 */
export function imagePlanRoomParts(
  node: NavNode,
  graph: NavigationGraph
): { anchor: { x: number; y: number }; parts: ImagePlanRoomPart[] } | null {
  const scale = getPlanScale(graph, node.floor);
  const comfortRoom = node.locationId?.endsWith("comfort-room") === true;
  const planParts = comfortRoom
      ? [
          { x0: 61, y0: 208, x1: 140, y1: 236, door: false },
          { x0: 61, y0: 234, x1: 107, y1: 252, door: false },
          { x0: 61, y0: 250, x1: 107, y1: 266, door: false },
          { x0: 61, y0: 263, x1: 140, y1: 289, door: false },
        ]
      : null;
  if (!planParts) return null;
  const placed = planParts.map((part) => {
    const x = (part.x0 + part.x1) / 2;
    const y = (part.y0 + part.y1) / 2;
    return {
      x,
      y,
      world: map2DToFloorPlan3D(x, y, graph, node.floor),
      size: [(part.x1 - part.x0) * scale, 1.15, (part.y1 - part.y0) * scale] as [number, number, number],
      door: part.door,
    };
  });
  const doorPart = placed.find((part) => part.door) ?? placed[0];
  const anchor = comfortRoom ? { x: 84, y: 248 } : { x: doorPart.x, y: doorPart.y };
  const anchorWorld = map2DToFloorPlan3D(anchor.x, anchor.y, graph, node.floor);
  return {
    anchor,
    parts: placed.map((part) => ({
      position: [part.world.x - anchorWorld.x, 0, part.world.z - anchorWorld.z],
      size: part.size,
      door: part.door,
    })),
  };
}

/** True when this location has a real room footprint on the capitol floor plan. */
export function hasCapitolOfficeFootprint(locationId: string | null | undefined): boolean {
  return Boolean(locationId && locationId in CAPITOL_ROOM_COLUMNS);
}

/** World placement that fills a room's outlined column on the floor-plan image. */
export function imagePlanRoomColumn(
  node: NavNode,
  graph: NavigationGraph
): { x: number; y: number; w: number; d: number; h: number } | null {
  const column = node.locationId ? CAPITOL_ROOM_COLUMNS[node.locationId] : undefined;
  if (!column) return null;
  // Grow past the plan outline so neighboring offices meet with no white gap.
  const inset = -2;
  const scale = getPlanScale(graph, node.floor);
  const cx = (column.x0 + column.x1) / 2;
  const cy = (column.y0 + column.y1) / 2;
  return {
    x: cx,
    y: cy,
    w: Math.max(column.x1 - column.x0 - inset * 2, 8) * scale,
    d: Math.max(column.y1 - column.y0 - inset * 2, 8) * scale,
    h: 1.15,
  };
}

/** Extruded mall-style blocks on top of a floor-plan image. */
export function nodeSizeForImagePlan(
  node: NavNode,
  graph?: NavigationGraph
): { w: number; d: number; h: number } {
  if (node.type === "staircase") {
    return nodeStairwellFootprint(node, graph);
  }

  const base = nodeSize(node);
  const shrink =
    node.type === "room" ? 0.58 : node.type === "facility" ? 0.54 : 0.62;
  const height =
    node.type === "room"
      ? 1.35
      : node.type === "facility"
        ? 1.05
        : node.type === "elevator"
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
      return { body: "#f4efe4", emissive: "#d6cbb8" };
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
