import type { FloorPlanConfig, NavigationGraph, NavEdge, NavNode } from "./types";

export const CAPITOL_GROUND_FLOOR_PLAN_URL = "/images/indoor-plans/capitol-ground-floor.png?v=2";
export const CAPITOL_UPPER_FLOOR_PLAN_URL = "/images/indoor-plans/capitol-upper-floor.png?v=3";
export const CAPITOL_GROUND_FLOOR_WIDTH = 936;
export const CAPITOL_GROUND_FLOOR_HEIGHT = 550;

const nodes: NavNode[] = [
  // Main entrance (bottom center)
  {
    id: "gf_main_entrance",
    floor: 1,
    x: 468,
    y: 518,
    type: "entrance",
    label: "Main Entrance",
    locationId: "gf-governor-entrance",
    landmark: true,
  },
  {
    id: "gf_kiosk",
    floor: 1,
    x: 500,
    y: 360,
    type: "landmark",
    label: "Directory Kiosk",
    locationId: "gf-kiosk",
    landmark: true,
  },
  {
    id: "gf_fire_exit",
    floor: 1,
    x: 52,
    y: 78,
    type: "emergency_exit",
    label: "Fire Exit",
    locationId: "gf-fire-exit",
    landmark: true,
    wheelchairAccessible: false,
  },

  // Elevators & restrooms (west side)
  {
    id: "gf_elevator_1",
    floor: 1,
    x: 204,
    y: 229,
    type: "elevator",
    label: "Elevator 1",
    locationId: "gf-elevator-1",
    landmark: true,
    wheelchairAccessible: true,
  },
  {
    id: "gf_elevator_2",
    floor: 1,
    x: 204,
    y: 272,
    type: "elevator",
    label: "Elevator 2",
    locationId: "gf-elevator-2",
    landmark: true,
    wheelchairAccessible: true,
  },
  {
    id: "gf_comfort_room",
    floor: 1,
    x: 84,
    y: 248,
    type: "room",
    label: "Comfort Room",
    locationId: "gf-comfort-room",
    wheelchairAccessible: true,
  },

  // Stairs — aligned to stairwell icons on the uploaded floor plan
  {
    id: "gf_stair_a",
    floor: 1,
    x: 332,
    y: 248,
    type: "staircase",
    label: "Stairs (Central)",
    locationId: "gf-stair-a",
    landmark: true,
    wheelchairAccessible: false,
  },
  {
    id: "gf_stair_b",
    floor: 1,
    x: 685,
    y: 246,
    type: "staircase",
    label: "Stairs (East)",
    locationId: "gf-stair-b",
    landmark: true,
    wheelchairAccessible: false,
  },

  // Corridor spine (green hallway on plan)
  { id: "gf_hall_w", floor: 1, x: 195, y: 292, type: "intersection", label: "West Corridor" },
  { id: "gf_hall_cw", floor: 1, x: 310, y: 292, type: "intersection", label: "Central West" },
  { id: "gf_hall_center", floor: 1, x: 468, y: 292, type: "intersection", label: "Central Corridor", landmark: true },
  { id: "gf_hall_ce", floor: 1, x: 620, y: 292, type: "intersection", label: "Central East" },
  { id: "gf_hall_e", floor: 1, x: 770, y: 292, type: "intersection", label: "East Corridor" },
  { id: "gf_hall_s", floor: 1, x: 494, y: 292, type: "intersection", label: "South Corridor" },

  // North wing — top row (left to right on plan)
  {
    id: "gf_veterinary",
    floor: 1,
    x: 110,
    y: 104,
    type: "room",
    label: "Provincial Veterinary Office",
    locationId: "gf-veterinary",
  },
  {
    id: "gf_agriculture",
    floor: 1,
    x: 235,
    y: 78,
    type: "room",
    label: "Provincial Agriculture Office",
    locationId: "gf-agriculture",
  },
  {
    id: "gf_general_services",
    floor: 1,
    x: 468,
    y: 78,
    type: "room",
    label: "Provincial General Services Office",
    locationId: "gf-general-services",
  },
  {
    id: "gf_budget",
    floor: 1,
    x: 655,
    y: 78,
    type: "room",
    label: "Provincial Budget Office",
    locationId: "gf-budget",
  },
  {
    id: "gf_health",
    floor: 1,
    x: 820,
    y: 78,
    type: "room",
    label: "Provincial Health Office",
    locationId: "gf-health",
  },

  // South wing — bottom row
  {
    id: "gf_social_welfare",
    floor: 1,
    x: 180,
    y: 478,
    type: "room",
    label: "Provincial Social Welfare and Development Office",
    locationId: "gf-social-welfare",
  },
  {
    id: "gf_assessor",
    floor: 1,
    x: 350,
    y: 478,
    type: "room",
    label: "Provincial Assessor's Office",
    locationId: "gf-assessor",
  },
  {
    id: "gf_people_assistance",
    floor: 1,
    x: 468,
    y: 430,
    type: "room",
    label: "People Assistance Office",
    locationId: "gf-people-assistance",
  },
  {
    id: "gf_treasury",
    floor: 1,
    x: 655,
    y: 478,
    type: "room",
    label: "Provincial Treasury Office",
    locationId: "gf-treasury",
  },
  {
    id: "gf_tourism",
    floor: 1,
    x: 820,
    y: 478,
    type: "room",
    label: "Provincial Tourism Office",
    locationId: "gf-tourism",
  },

  // East wing
  {
    id: "gf_conference",
    floor: 1,
    x: 880,
    y: 292,
    type: "room",
    label: "PDRRMO",
    locationId: "gf-conference",
  },

  // ── 2nd Floor ──
  {
    id: "f2_elevator_1",
    floor: 2,
    x: 204,
    y: 229,
    type: "elevator",
    label: "Elevator 1",
    locationId: "f2-elevator-1",
    landmark: true,
    wheelchairAccessible: true,
  },
  {
    id: "f2_elevator_2",
    floor: 2,
    x: 204,
    y: 272,
    type: "elevator",
    label: "Elevator 2",
    locationId: "f2-elevator-2",
    landmark: true,
    wheelchairAccessible: true,
  },
  {
    id: "f2_stair_a",
    floor: 2,
    x: 332,
    y: 248,
    type: "staircase",
    label: "Stairs (Central)",
    locationId: "f2-stair-a",
    landmark: true,
    wheelchairAccessible: false,
  },
  {
    id: "f2_stair_b",
    floor: 2,
    x: 685,
    y: 246,
    type: "staircase",
    label: "Stairs (East)",
    locationId: "f2-stair-b",
    landmark: true,
    wheelchairAccessible: false,
  },
  { id: "f2_hall_w", floor: 2, x: 195, y: 292, type: "intersection", label: "West Corridor" },
  { id: "f2_hall_center", floor: 2, x: 468, y: 292, type: "intersection", label: "Central Corridor", landmark: true },
  { id: "f2_hall_e", floor: 2, x: 770, y: 292, type: "intersection", label: "East Corridor" },
  {
    id: "f2_governor",
    floor: 2,
    x: 140,
    y: 424,
    type: "room",
    label: "Governor's Office",
    locationId: "f2-governor",
  },
  {
    id: "f2_administrator",
    floor: 2,
    x: 305,
    y: 424,
    type: "room",
    label: "Administrator Office",
    locationId: "f2-administrator",
  },
  {
    id: "f2_admin",
    floor: 2,
    x: 428,
    y: 394,
    type: "room",
    label: "Congressman Office",
    locationId: "f2-admin",
  },
  {
    id: "f2_legal",
    floor: 2,
    x: 510,
    y: 394,
    type: "room",
    label: "Legal Department",
    locationId: "f2-legal",
  },
  {
    id: "f2_environment",
    floor: 2,
    x: 591,
    y: 392,
    type: "room",
    label: "Environment and Natural Resources",
    locationId: "f2-environment",
  },
  {
    id: "f2_bac",
    floor: 2,
    x: 673,
    y: 392,
    type: "room",
    label: "Bids and Award Committee Office",
    locationId: "f2-bac",
  },
  {
    id: "f2_engineering",
    floor: 2,
    x: 140,
    y: 104,
    type: "room",
    label: "Provincial Engineering Department",
    locationId: "f2-engineering",
  },
  {
    id: "f2_accounting",
    floor: 2,
    x: 796,
    y: 391,
    type: "room",
    label: "Accounting Department",
    locationId: "f2-accounting",
  },

  // ── 3rd Floor ──
  {
    id: "f3_elevator_1",
    floor: 3,
    x: 204,
    y: 229,
    type: "elevator",
    label: "Elevator 1",
    locationId: "f3-elevator-1",
    landmark: true,
    wheelchairAccessible: true,
  },
  {
    id: "f3_elevator_2",
    floor: 3,
    x: 204,
    y: 272,
    type: "elevator",
    label: "Elevator 2",
    locationId: "f3-elevator-2",
    landmark: true,
    wheelchairAccessible: true,
  },
  {
    id: "f3_stair_a",
    floor: 3,
    x: 332,
    y: 248,
    type: "staircase",
    label: "Stairs (Central)",
    locationId: "f3-stair-a",
    landmark: true,
    wheelchairAccessible: false,
  },
  {
    id: "f3_stair_b",
    floor: 3,
    x: 685,
    y: 246,
    type: "staircase",
    label: "Stairs (East)",
    locationId: "f3-stair-b",
    landmark: true,
    wheelchairAccessible: false,
  },
  { id: "f3_hall_w", floor: 3, x: 195, y: 292, type: "intersection", label: "West Corridor" },
  { id: "f3_hall_center", floor: 3, x: 468, y: 292, type: "intersection", label: "Central Corridor", landmark: true },
  { id: "f3_hall_e", floor: 3, x: 770, y: 292, type: "intersection", label: "East Corridor" },
];

/** Same footprints as the ground-floor offices, left to right by band. */
const UPPER_FLOOR_OFFICES: Array<{
  x: number;
  y: number;
  hall: "hall_w" | "hall_cw" | "hall_center" | "hall_ce" | "hall_e" | "hall_s";
  meters: number;
}> = [
  { x: 110, y: 104, hall: "hall_w", meters: 24 },
  { x: 235, y: 78, hall: "hall_cw", meters: 24 },
  { x: 468, y: 78, hall: "hall_center", meters: 24 },
  { x: 655, y: 78, hall: "hall_ce", meters: 24 },
  { x: 820, y: 78, hall: "hall_e", meters: 24 },
  { x: 880, y: 292, hall: "hall_e", meters: 14 },
  { x: 180, y: 478, hall: "hall_w", meters: 24 },
  { x: 350, y: 478, hall: "hall_cw", meters: 24 },
  { x: 468, y: 430, hall: "hall_s", meters: 8 },
  { x: 655, y: 478, hall: "hall_ce", meters: 24 },
  { x: 820, y: 478, hall: "hall_e", meters: 24 },
];

/**
 * Upper-floor offices replaced by named rooms.
 * Floor 2 index 0 is engineering. Index 2 is merged into planning.
 * Floor 3 office 8 is merged into the Multi-Purpose Hall (office 7).
 * Floor 3 offices 10 and 11 are merged into Archive (office 9).
 */
function isReplacedUpperOffice(floor: 2 | 3, index: number) {
  if (floor === 2) {
    return index === 0 || index === 2 || index === 6 || index === 7 || index === 8 || index === 9 || index === 10;
  }
  return index === 7 || index === 9 || index === 10;
}

const F2_RENAMED_OFFICES: Record<number, { id: string; label: string; locationId: string; x?: number; y?: number }> = {
  1: {
    id: "f2_peso",
    label: "Public Employment Services Office Department",
    locationId: "f2-peso",
  },
  3: {
    id: "f2_planning",
    label: "Provincial Planning Development Department",
    locationId: "f2-planning",
    x: 550,
    y: 102,
  },
  4: {
    id: "f2_audit",
    label: "Internal Audit Services",
    locationId: "f2-audit",
  },
  5: {
    id: "f2_conference",
    label: "Conference Room",
    locationId: "f2-conference",
  },
};

const F3_RENAMED_OFFICES: Record<number, { id: string; label: string; locationId: string; hall?: "hall_cw" | "hall_ce"; x?: number; y?: number }> = {
  0: {
    id: "f3_information",
    label: "Information Office",
    locationId: "f3-information",
    x: 141,
    y: 104,
  },
  1: {
    id: "f3_sanggunian",
    label: "Sangguniang Panlalawigan Office",
    locationId: "f3-sanggunian",
    x: 305,
    y: 103,
  },
  2: {
    id: "f3_secretariat",
    label: "Secretariat Office",
    locationId: "f3-secretariat",
    x: 468,
    y: 102,
  },
  3: {
    id: "f3_session",
    label: "Session Hall",
    locationId: "f3-session",
    x: 631,
    y: 101,
  },
  4: {
    id: "f3_vice_governor",
    label: "Office of the Vice Governor",
    locationId: "f3-vice-governor",
    x: 795,
    y: 100,
  },
  5: {
    id: "f3_cpmc",
    label: "CPMC",
    locationId: "f3-cpmc",
  },
  6: {
    id: "f3_multipurpose",
    label: "Multi-Purpose Hall",
    locationId: "f3-multipurpose",
    hall: "hall_cw",
    x: 223,
    y: 425,
  },
  8: {
    id: "f3_archive",
    label: "Archive",
    locationId: "f3-archive",
    hall: "hall_ce",
    x: 632,
    y: 392,
  },
};

function addUpperFloorOffices(floor: 2 | 3, floorName: string) {
  const prefix = floor === 2 ? "f2" : "f3";
  nodes.push(
    { id: `${prefix}_hall_cw`, floor, x: 310, y: 292, type: "intersection", label: "Central West" },
    { id: `${prefix}_hall_ce`, floor, x: 620, y: 292, type: "intersection", label: "Central East" },
    { id: `${prefix}_hall_s`, floor, x: 494, y: 292, type: "intersection", label: "South Corridor" },
    ...UPPER_FLOOR_OFFICES.flatMap((office, index): NavNode[] => {
      if (isReplacedUpperOffice(floor, index)) return [];
      const named = floor === 2 ? F2_RENAMED_OFFICES[index] : F3_RENAMED_OFFICES[index];
      return [
        {
          id: named?.id ?? `${prefix}_office_${index + 1}`,
          floor,
          x: named?.x ?? office.x,
          y: named?.y ?? office.y,
          type: "room",
          label: named?.label ?? `${floorName} Office ${index + 1}`,
          locationId: named?.locationId ?? `${prefix}-office-${index + 1}`,
        },
      ];
    })
  );
}

addUpperFloorOffices(2, "Second Floor");
addUpperFloorOffices(3, "Third Floor");

for (const floor of [2, 3] as const) {
  const prefix = floor === 2 ? "f2" : "f3";
  nodes.push({
    id: `${prefix}_comfort_room`,
    floor,
    x: 84,
    y: 248,
    type: "room",
    label: "Comfort Room",
    locationId: `${prefix}-comfort-room`,
    wheelchairAccessible: true,
  });
}

function edge(from: string, to: string, distanceMeters: number, opts?: Partial<NavEdge>): NavEdge {
  return {
    from,
    to,
    distanceMeters,
    wheelchairAccessible: opts?.wheelchairAccessible ?? true,
    restricted: opts?.restricted ?? false,
    vertical: opts?.vertical ?? false,
    instruction: opts?.instruction,
  };
}

const edges: NavEdge[] = [
  edge("gf_main_entrance", "gf_kiosk", 8, { instruction: "Enter through the main doors at the bottom of the building." }),
  edge("gf_kiosk", "gf_main_entrance", 8),
  edge("gf_kiosk", "gf_hall_s", 10),
  edge("gf_hall_s", "gf_kiosk", 10),
  edge("gf_hall_s", "gf_hall_center", 14, { instruction: "Walk north into the main corridor." }),
  edge("gf_hall_center", "gf_hall_s", 14),

  edge("gf_hall_w", "gf_hall_cw", 12),
  edge("gf_hall_cw", "gf_hall_w", 12),
  edge("gf_hall_cw", "gf_hall_center", 14),
  edge("gf_hall_center", "gf_hall_cw", 14),
  edge("gf_hall_center", "gf_hall_ce", 14),
  edge("gf_hall_ce", "gf_hall_center", 14),
  edge("gf_hall_ce", "gf_hall_e", 12),
  edge("gf_hall_e", "gf_hall_ce", 12),

  edge("gf_hall_w", "gf_elevator_1", 8),
  edge("gf_elevator_1", "gf_hall_w", 8),
  edge("gf_elevator_1", "gf_elevator_2", 3),
  edge("gf_elevator_2", "gf_elevator_1", 3),
  edge("gf_hall_w", "gf_comfort_room", 8),
  edge("gf_comfort_room", "gf_hall_w", 8),

  edge("gf_hall_cw", "gf_stair_a", 4, { wheelchairAccessible: false }),
  edge("gf_stair_a", "gf_hall_cw", 4, { wheelchairAccessible: false }),
  edge("gf_stair_a", "gf_hall_center", 10, { wheelchairAccessible: false }),
  edge("gf_hall_center", "gf_stair_a", 10, { wheelchairAccessible: false }),
  edge("gf_hall_center", "gf_stair_b", 10, { wheelchairAccessible: false }),
  edge("gf_stair_b", "gf_hall_center", 10, { wheelchairAccessible: false }),
  edge("gf_stair_b", "gf_hall_ce", 4, { wheelchairAccessible: false }),
  edge("gf_hall_ce", "gf_stair_b", 4, { wheelchairAccessible: false }),

  edge("gf_hall_w", "gf_veterinary", 24),
  edge("gf_veterinary", "gf_hall_w", 24),
  edge("gf_hall_cw", "gf_agriculture", 24),
  edge("gf_agriculture", "gf_hall_cw", 24),
  edge("gf_hall_center", "gf_general_services", 24),
  edge("gf_general_services", "gf_hall_center", 24),
  edge("gf_hall_ce", "gf_budget", 24),
  edge("gf_budget", "gf_hall_ce", 24),
  edge("gf_hall_e", "gf_health", 24),
  edge("gf_health", "gf_hall_e", 24),

  edge("gf_hall_w", "gf_social_welfare", 24),
  edge("gf_social_welfare", "gf_hall_w", 24),
  edge("gf_hall_cw", "gf_assessor", 24),
  edge("gf_assessor", "gf_hall_cw", 24),
  edge("gf_hall_s", "gf_people_assistance", 8),
  edge("gf_people_assistance", "gf_hall_s", 8),
  edge("gf_hall_ce", "gf_treasury", 24, { instruction: "Provincial Treasury Office is on the south side." }),
  edge("gf_treasury", "gf_hall_ce", 24),
  edge("gf_hall_e", "gf_tourism", 24),
  edge("gf_tourism", "gf_hall_e", 24),

  edge("gf_hall_e", "gf_conference", 14),
  edge("gf_conference", "gf_hall_e", 14),

  edge("gf_veterinary", "gf_fire_exit", 18, { wheelchairAccessible: false }),
  edge("gf_fire_exit", "gf_veterinary", 18, { wheelchairAccessible: false }),

  // Vertical — elevators
  edge("gf_elevator_1", "f2_elevator_1", 0, {
    vertical: true,
    wheelchairAccessible: true,
    instruction: "Take Elevator 1 to the 2nd Floor.",
  }),
  edge("f2_elevator_1", "gf_elevator_1", 0, { vertical: true, wheelchairAccessible: true }),
  edge("f2_elevator_1", "f3_elevator_1", 0, {
    vertical: true,
    wheelchairAccessible: true,
    instruction: "Take Elevator 1 to the 3rd Floor.",
  }),
  edge("f3_elevator_1", "f2_elevator_1", 0, { vertical: true, wheelchairAccessible: true }),
  edge("gf_elevator_2", "f2_elevator_2", 0, { vertical: true, wheelchairAccessible: true }),
  edge("f2_elevator_2", "gf_elevator_2", 0, { vertical: true, wheelchairAccessible: true }),
  edge("f2_elevator_2", "f3_elevator_2", 0, { vertical: true, wheelchairAccessible: true }),
  edge("f3_elevator_2", "f2_elevator_2", 0, { vertical: true, wheelchairAccessible: true }),

  // Vertical — stairs
  edge("gf_stair_a", "f2_stair_a", 0, {
    vertical: true,
    wheelchairAccessible: false,
    instruction: "Take the stairs to the 2nd Floor.",
  }),
  edge("f2_stair_a", "gf_stair_a", 0, { vertical: true, wheelchairAccessible: false }),
  edge("f2_stair_a", "f3_stair_a", 0, {
    vertical: true,
    wheelchairAccessible: false,
    instruction: "Take the stairs to the 3rd Floor.",
  }),
  edge("f3_stair_a", "f2_stair_a", 0, { vertical: true, wheelchairAccessible: false }),
  edge("gf_stair_b", "f2_stair_b", 0, {
    vertical: true,
    wheelchairAccessible: false,
    instruction: "Take the east stairs to the 2nd Floor.",
  }),
  edge("f2_stair_b", "gf_stair_b", 0, { vertical: true, wheelchairAccessible: false }),
  edge("f2_stair_b", "f3_stair_b", 0, {
    vertical: true,
    wheelchairAccessible: false,
    instruction: "Take the east stairs to the 3rd Floor.",
  }),
  edge("f3_stair_b", "f2_stair_b", 0, { vertical: true, wheelchairAccessible: false }),

  // 2nd floor horizontal
  edge("f2_hall_w", "f2_hall_center", 14),
  edge("f2_hall_center", "f2_hall_w", 14),
  edge("f2_hall_center", "f2_hall_e", 14),
  edge("f2_hall_e", "f2_hall_center", 14),
  edge("f2_hall_w", "f2_elevator_1", 5),
  edge("f2_elevator_1", "f2_hall_w", 5),
  edge("f2_elevator_1", "f2_elevator_2", 3),
  edge("f2_elevator_2", "f2_elevator_1", 3),
  edge("f2_hall_w", "f2_stair_a", 12, { wheelchairAccessible: false }),
  edge("f2_stair_a", "f2_hall_w", 12, { wheelchairAccessible: false }),
  edge("f2_stair_a", "f2_hall_center", 10, { wheelchairAccessible: false }),
  edge("f2_hall_center", "f2_stair_a", 10, { wheelchairAccessible: false }),
  edge("f2_hall_center", "f2_stair_b", 10, { wheelchairAccessible: false }),
  edge("f2_stair_b", "f2_hall_center", 10, { wheelchairAccessible: false }),
  edge("f2_stair_b", "f2_hall_e", 12, { wheelchairAccessible: false }),
  edge("f2_hall_e", "f2_stair_b", 12, { wheelchairAccessible: false }),
  edge("f2_hall_w", "f2_governor", 22),
  edge("f2_governor", "f2_hall_w", 22),
  edge("f2_hall_cw", "f2_administrator", 22),
  edge("f2_administrator", "f2_hall_cw", 22),
  edge("f2_hall_s", "f2_admin", 8),
  edge("f2_admin", "f2_hall_s", 8),
  edge("f2_hall_s", "f2_legal", 8),
  edge("f2_legal", "f2_hall_s", 8),
  edge("f2_hall_ce", "f2_environment", 16),
  edge("f2_environment", "f2_hall_ce", 16),
  edge("f2_hall_ce", "f2_bac", 16),
  edge("f2_bac", "f2_hall_ce", 16),
  edge("f2_hall_w", "f2_engineering", 22),
  edge("f2_engineering", "f2_hall_w", 22),
  edge("f2_hall_e", "f2_accounting", 24),
  edge("f2_accounting", "f2_hall_e", 24),

  // 3rd floor horizontal
  edge("f3_hall_w", "f3_hall_center", 14),
  edge("f3_hall_center", "f3_hall_w", 14),
  edge("f3_hall_center", "f3_hall_e", 14),
  edge("f3_hall_e", "f3_hall_center", 14),
  edge("f3_hall_w", "f3_elevator_1", 5),
  edge("f3_elevator_1", "f3_hall_w", 5),
  edge("f3_elevator_1", "f3_elevator_2", 3),
  edge("f3_elevator_2", "f3_elevator_1", 3),
  edge("f3_hall_w", "f3_stair_a", 12, { wheelchairAccessible: false }),
  edge("f3_stair_a", "f3_hall_w", 12, { wheelchairAccessible: false }),
  edge("f3_stair_a", "f3_hall_center", 10, { wheelchairAccessible: false }),
  edge("f3_hall_center", "f3_stair_a", 10, { wheelchairAccessible: false }),
  edge("f3_hall_center", "f3_stair_b", 10, { wheelchairAccessible: false }),
  edge("f3_stair_b", "f3_hall_center", 10, { wheelchairAccessible: false }),
  edge("f3_stair_b", "f3_hall_e", 12, { wheelchairAccessible: false }),
  edge("f3_hall_e", "f3_stair_b", 12, { wheelchairAccessible: false }),
];

for (const prefix of ["f2", "f3"] as const) {
  edges.push(
    edge(`${prefix}_hall_w`, `${prefix}_hall_cw`, 12),
    edge(`${prefix}_hall_cw`, `${prefix}_hall_w`, 12),
    edge(`${prefix}_hall_cw`, `${prefix}_hall_center`, 14),
    edge(`${prefix}_hall_center`, `${prefix}_hall_cw`, 14),
    edge(`${prefix}_hall_center`, `${prefix}_hall_ce`, 14),
    edge(`${prefix}_hall_ce`, `${prefix}_hall_center`, 14),
    edge(`${prefix}_hall_ce`, `${prefix}_hall_e`, 12),
    edge(`${prefix}_hall_e`, `${prefix}_hall_ce`, 12),
    edge(`${prefix}_hall_s`, `${prefix}_hall_center`, 14),
    edge(`${prefix}_hall_center`, `${prefix}_hall_s`, 14),
    edge(`${prefix}_hall_w`, `${prefix}_comfort_room`, 8),
    edge(`${prefix}_comfort_room`, `${prefix}_hall_w`, 8)
  );
  UPPER_FLOOR_OFFICES.forEach((office, index) => {
    const floor = prefix === "f2" ? 2 : 3;
    if (isReplacedUpperOffice(floor, index)) return;
    const named = floor === 2 ? F2_RENAMED_OFFICES[index] : F3_RENAMED_OFFICES[index];
    const roomId = named?.id ?? `${prefix}_office_${index + 1}`;
    const hallId = `${prefix}_${named && "hall" in named && named.hall ? named.hall : office.hall}`;
    edges.push(edge(hallId, roomId, office.meters), edge(roomId, hallId, office.meters));
  });
}

const CAPITOL_HALLWAYS: FloorPlanConfig["hallways"] = [
  { x: 70, y: 250, width: 796, height: 85 },
  { x: 390, y: 335, width: 156, height: 195 },
];

const floorPlans: FloorPlanConfig[] = [
  {
    floor: 1,
    label: "Ground Floor",
    width: CAPITOL_GROUND_FLOOR_WIDTH,
    height: CAPITOL_GROUND_FLOOR_HEIGHT,
    imageUrl: CAPITOL_GROUND_FLOOR_PLAN_URL,
    hallways: CAPITOL_HALLWAYS,
  },
  {
    floor: 2,
    label: "2nd Floor",
    width: CAPITOL_GROUND_FLOOR_WIDTH,
    height: CAPITOL_GROUND_FLOOR_HEIGHT,
    imageUrl: CAPITOL_UPPER_FLOOR_PLAN_URL,
    hallways: CAPITOL_HALLWAYS,
  },
  {
    floor: 3,
    label: "3rd Floor",
    width: CAPITOL_GROUND_FLOOR_WIDTH,
    height: CAPITOL_GROUND_FLOOR_HEIGHT,
    imageUrl: CAPITOL_UPPER_FLOOR_PLAN_URL,
    hallways: CAPITOL_HALLWAYS,
  },
];

export const CAPITOL_GROUND_NAVIGATION_GRAPH: NavigationGraph = {
  nodes,
  edges,
  floorPlans,
  defaultStartLocationId: "gf-kiosk",
};
