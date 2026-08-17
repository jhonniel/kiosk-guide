import type { FloorPlanConfig, NavigationGraph, NavEdge, NavNode } from "./types";

export const CAPITOL_GROUND_FLOOR_PLAN_URL = "/images/indoor-plans/capitol-ground-floor.png";
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
    x: 468,
    y: 455,
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
    x: 112,
    y: 292,
    type: "elevator",
    label: "Elevator 1",
    locationId: "gf-elevator-1",
    landmark: true,
    wheelchairAccessible: true,
  },
  {
    id: "gf_elevator_2",
    floor: 1,
    x: 152,
    y: 292,
    type: "elevator",
    label: "Elevator 2",
    locationId: "gf-elevator-2",
    landmark: true,
    wheelchairAccessible: true,
  },
  {
    id: "gf_restroom_f",
    floor: 1,
    x: 52,
    y: 292,
    type: "facility",
    label: "Female Comfort Room",
    locationId: "gf-restroom-f",
    wheelchairAccessible: true,
  },

  // Stairs (center of main corridor)
  {
    id: "gf_stair_a",
    floor: 1,
    x: 468,
    y: 292,
    type: "staircase",
    label: "Stairs",
    locationId: "gf-stair-a",
    landmark: true,
    wheelchairAccessible: false,
  },

  // Corridor spine (green hallway on plan)
  { id: "gf_hall_w", floor: 1, x: 195, y: 292, type: "intersection", label: "West Corridor" },
  { id: "gf_hall_cw", floor: 1, x: 310, y: 292, type: "intersection", label: "Central West" },
  { id: "gf_hall_center", floor: 1, x: 468, y: 292, type: "intersection", label: "Central Corridor", landmark: true },
  { id: "gf_hall_ce", floor: 1, x: 620, y: 292, type: "intersection", label: "Central East" },
  { id: "gf_hall_e", floor: 1, x: 770, y: 292, type: "intersection", label: "East Corridor" },
  { id: "gf_hall_s", floor: 1, x: 468, y: 395, type: "intersection", label: "South Corridor" },

  // North wing — top row (left to right on plan)
  {
    id: "gf_veterinary",
    floor: 1,
    x: 95,
    y: 78,
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
    label: "Conference Room Ground Floor",
    locationId: "gf-conference",
  },
];

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

  edge("gf_hall_cw", "gf_elevator_1", 5),
  edge("gf_elevator_1", "gf_hall_cw", 5),
  edge("gf_elevator_1", "gf_elevator_2", 3),
  edge("gf_elevator_2", "gf_elevator_1", 3),
  edge("gf_hall_w", "gf_restroom_f", 8),
  edge("gf_restroom_f", "gf_hall_w", 8),

  edge("gf_hall_center", "gf_stair_a", 3, { wheelchairAccessible: false }),
  edge("gf_stair_a", "gf_hall_center", 3, { wheelchairAccessible: false }),

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
];

const floorPlans: FloorPlanConfig[] = [
  {
    floor: 1,
    label: "Ground Floor",
    width: CAPITOL_GROUND_FLOOR_WIDTH,
    height: CAPITOL_GROUND_FLOOR_HEIGHT,
    imageUrl: CAPITOL_GROUND_FLOOR_PLAN_URL,
    hallways: [
      { x: 70, y: 250, width: 796, height: 85 },
      { x: 390, y: 335, width: 156, height: 195 },
    ],
  },
];

export const CAPITOL_GROUND_NAVIGATION_GRAPH: NavigationGraph = {
  nodes,
  edges,
  floorPlans,
  defaultStartLocationId: "gf-kiosk",
};
