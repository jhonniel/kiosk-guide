import type { BuildingLocationData } from "./types";

export const CAPITOL_BUILDING_NAME_EN = "Provincial Capitol Building";
export const CAPITOL_BUILDING_NAME_FIL = "Capitol Building";
export const CAPITOL_BUILDING_NAME_BIS = "Capitol Building";

function loc(
  id: string,
  nameEn: string,
  room: string,
  directionsEn: string[],
  opts?: {
    nameFil?: string;
    category?: string;
    aliases?: string[];
    nearbyLandmarks?: string[];
  }
): BuildingLocationData {
  return {
    id,
    buildingNameEn: CAPITOL_BUILDING_NAME_EN,
    buildingNameFil: CAPITOL_BUILDING_NAME_FIL,
    buildingNameBis: CAPITOL_BUILDING_NAME_BIS,
    nameEn,
    nameFil: opts?.nameFil,
    floor: 1,
    floorLabelEn: "Ground Floor",
    floorLabelFil: "Ground Floor",
    floorLabelBis: "Ground Floor",
    room,
    locationType: "room",
    category: opts?.category,
    nearbyLandmarks: opts?.nearbyLandmarks ?? [],
    directionsEn,
    aliases: opts?.aliases,
  };
}

function facility(
  id: string,
  nameEn: string,
  directionsEn: string[],
  opts?: {
    category?: string;
    aliases?: string[];
    nearbyLandmarks?: string[];
  }
): BuildingLocationData {
  return {
    id,
    buildingNameEn: CAPITOL_BUILDING_NAME_EN,
    buildingNameFil: CAPITOL_BUILDING_NAME_FIL,
    buildingNameBis: CAPITOL_BUILDING_NAME_BIS,
    nameEn,
    floor: 1,
    floorLabelEn: "Ground Floor",
    floorLabelFil: "Ground Floor",
    floorLabelBis: "Ground Floor",
    locationType: "facility",
    category: opts?.category,
    nearbyLandmarks: opts?.nearbyLandmarks ?? [],
    directionsEn,
    aliases: opts?.aliases,
  };
}

export const CAPITOL_BUILDING_LOCATIONS: BuildingLocationData[] = [
  facility("gf-governor-entrance", "Governor Entrance Ground Floor", [
    "You are at the Governor Entrance on the ground floor.",
    "Walk straight ahead to reach the central corridor and directory kiosk.",
  ], { category: "entrance", aliases: ["entrance", "governor entrance", "main entrance", "lobby"] }),

  facility("gf-kiosk", "Directory Kiosk", [
    "You are at the Building Directory kiosk in the central corridor.",
    "All ground-floor provincial offices branch off from this hallway.",
  ], { category: "service", aliases: ["kiosk", "you are here", "directory"], nearbyLandmarks: ["Governor Entrance", "Central Corridor"] }),

  facility("gf-fire-exit", "Fire Exit Ground Floor Back", [
    "The fire exit is at the back of the building near the Provincial Veterinary Office.",
    "Use only in an emergency.",
  ], { category: "emergency", aliases: ["fire exit", "emergency exit"], nearbyLandmarks: ["Provincial Veterinary Office"] }),

  facility("gf-elevator-1", "Elevator 1", [
    "From the central corridor, Elevator 1 is on the west side near the elevator bank.",
  ], { category: "facility", aliases: ["elevator", "elevator 1", "lift"], nearbyLandmarks: ["Central Corridor"] }),

  facility("gf-elevator-2", "Elevator 2", [
    "From the central corridor, Elevator 2 is beside Elevator 1 on the west side.",
  ], { category: "facility", aliases: ["elevator", "elevator 2", "lift"], nearbyLandmarks: ["Central Corridor", "Elevator 1"] }),

  facility("gf-stair-a", "Stairs (Central)", [
    "From the central corridor, the stairs are in the center-left section of the hallway.",
  ], { category: "facility", aliases: ["stairs", "staircase", "stairs up"] }),

  facility("gf-stair-b", "Stairs (East)", [
    "From the central corridor, the second stairway is in the center-right section of the hallway.",
  ], { category: "facility", aliases: ["stairs", "staircase", "stairs up"] }),

  facility("gf-restroom-f", "Female Comfort Room", [
    "From the Governor Entrance area, the female comfort room is on the west side near the entrance.",
  ], { category: "facility", aliases: ["restroom", "comfort room", "cr", "toilet", "female restroom"] }),

  loc("gf-veterinary", "Provincial Veterinary Office", "North Wing", [
    "Enter the central corridor from the kiosk.",
    "Walk west and turn north — the Provincial Veterinary Office is at the northwest corner.",
  ], {
    category: "office",
    aliases: ["veterinary", "vet", "provincial veterinary"],
    nearbyLandmarks: ["Central Corridor", "Fire Exit"],
  }),

  loc("gf-agriculture", "Provincial Agriculture Office", "North Wing", [
    "Enter the central corridor and walk west.",
    "The Provincial Agriculture Office is on the north side of the ground floor.",
  ], {
    category: "office",
    aliases: ["agriculture", "provincial agriculture", "agri"],
    nearbyLandmarks: ["Central Corridor"],
  }),

  loc("gf-general-services", "Provincial General Services Office", "North Wing", [
    "Enter the central corridor.",
    "The Provincial General Services Office is on the north side at the center of the building.",
  ], {
    category: "office",
    aliases: ["general services", "gso", "provincial general services"],
    nearbyLandmarks: ["Central Corridor"],
  }),

  loc("gf-budget", "Provincial Budget Office", "North Wing", [
    "Enter the central corridor and walk east.",
    "The Provincial Budget Office is on the north side of the ground floor.",
  ], {
    category: "office",
    aliases: ["budget", "provincial budget"],
    nearbyLandmarks: ["Central Corridor"],
  }),

  loc("gf-health", "Provincial Health Office", "North Wing", [
    "Enter the central corridor and walk to the east end.",
    "The Provincial Health Office is at the northeast corner of the ground floor.",
  ], {
    category: "office",
    aliases: ["health", "provincial health", "doh"],
    nearbyLandmarks: ["Central Corridor"],
  }),

  loc("gf-conference", "Conference Room Ground Floor", "East Wing", [
    "Enter the central corridor and walk east.",
    "The Conference Room is on the east side of the ground floor.",
  ], {
    category: "office",
    aliases: ["conference", "conference room", "meeting room"],
    nearbyLandmarks: ["Central Corridor"],
  }),

  loc("gf-social-welfare", "Provincial Social Welfare and Development Office", "South Wing", [
    "Enter the central corridor and walk west.",
    "The Provincial Social Welfare and Development Office is at the southwest section of the ground floor.",
  ], {
    category: "office",
    aliases: ["social welfare", "pswdo", "dswd", "social welfare and development"],
    nearbyLandmarks: ["Central Corridor"],
  }),

  loc("gf-assessor", "Provincial Assessor's Office", "South Wing", [
    "Enter the central corridor.",
    "The Provincial Assessor's Office is on the south side of the ground floor.",
  ], {
    category: "office",
    aliases: ["assessor", "provincial assessor", "assessor's office"],
    nearbyLandmarks: ["Central Corridor"],
  }),

  loc("gf-people-assistance", "People Assistance Office", "South Wing", [
    "Enter the central corridor.",
    "The People Assistance Office is on the south side near the center of the building.",
  ], {
    category: "office",
    aliases: ["people assistance", "assistance", "citizen assistance"],
    nearbyLandmarks: ["Central Corridor"],
  }),

  loc("gf-treasury", "Provincial Treasury Office", "South Wing", [
    "Enter the central corridor and walk east.",
    "The Provincial Treasury Office is on the south side of the ground floor.",
  ], {
    category: "office",
    aliases: ["treasury", "provincial treasury", "treasurer", "cedula", "tax"],
    nearbyLandmarks: ["Central Corridor"],
  }),

  loc("gf-tourism", "Provincial Tourism Office", "South Wing", [
    "Enter the central corridor and walk to the east end.",
    "The Provincial Tourism Office is at the southeast corner of the ground floor.",
  ], {
    category: "office",
    aliases: ["tourism", "provincial tourism", "pto"],
    nearbyLandmarks: ["Central Corridor"],
  }),
];
