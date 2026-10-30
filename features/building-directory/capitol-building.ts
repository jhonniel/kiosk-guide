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
    floor?: number;
    floorLabelEn?: string;
    floorLabelFil?: string;
    floorLabelBis?: string;
  }
): BuildingLocationData {
  const floor = opts?.floor ?? 1;
  const floorLabelEn = opts?.floorLabelEn ?? (floor === 1 ? "Ground Floor" : floor === 2 ? "2nd Floor" : "3rd Floor");
  const floorLabelFil = opts?.floorLabelFil ?? floorLabelEn;
  const floorLabelBis = opts?.floorLabelBis ?? floorLabelEn;
  return {
    id,
    buildingNameEn: CAPITOL_BUILDING_NAME_EN,
    buildingNameFil: CAPITOL_BUILDING_NAME_FIL,
    buildingNameBis: CAPITOL_BUILDING_NAME_BIS,
    nameEn,
    nameFil: opts?.nameFil,
    floor,
    floorLabelEn,
    floorLabelFil,
    floorLabelBis,
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

  facility("gf-comfort-room", "Comfort Room", [
    "From the central corridor, walk to the west end near the elevators.",
    "The Comfort Room is the room beside the west hallway spur.",
  ], { category: "facility", aliases: ["restroom", "comfort room", "cr", "toilet", "male", "female", "male restroom", "female restroom", "male comfort room", "female comfort room"] }),

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

  loc("gf-conference", "PDRRMO", "East Wing", [
    "Enter the central corridor and walk east.",
    "The PDRRMO is on the east side of the ground floor.",
  ], {
    category: "office",
    aliases: ["pdrrmo", "disaster risk reduction", "disaster management"],
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

  // 2nd Floor
  loc("f2-governor", "Governor's Office", "South Wing", [
    "Take Elevator 1 or the stairs to the 2nd Floor.",
    "The Governor's Office is the southwest room on the 2nd floor.",
  ], {
    floor: 2,
    category: "office",
    aliases: ["governor", "governor's office", "governor office", "romualdo"],
    nearbyLandmarks: ["Central Corridor", "Elevator 1"],
  }),
  loc("f2-administrator", "Administrator Office", "South Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "The Administrator Office is the room beside the Governor's Office.",
  ], {
    floor: 2,
    category: "office",
    aliases: ["administrator office", "administrator"],
    nearbyLandmarks: ["Governor's Office"],
  }),
  loc("f2-engineering", "Provincial Engineering Department", "North Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "The Provincial Engineering Department is the northwest room on the 2nd floor.",
  ], { floor: 2, category: "office", aliases: ["engineering", "engr", "provincial engineering"] }),
  loc("f2-peso", "Public Employment Services Office Department", "North Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "The Public Employment Services Office Department is on the north side of the 2nd floor.",
  ], { floor: 2, category: "office", aliases: ["peso", "public employment", "employment services"] }),
  loc("f2-planning", "Provincial Planning Development Department", "North Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "The Provincial Planning Development Department occupies the two middle rooms on the north side of the 2nd floor.",
  ], { floor: 2, category: "office", aliases: ["planning", "ppdo", "provincial planning"] }),
  loc("f2-audit", "Internal Audit Services", "North Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "Internal Audit Services is at the northeast side of the 2nd floor.",
  ], { floor: 2, category: "office", aliases: ["internal audit", "audit services", "ias"] }),
  loc("f2-conference", "Conference Room", "East Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "The Conference Room is on the east side of the 2nd floor.",
  ], { floor: 2, category: "office", aliases: ["2nd floor conference", "second floor conference room"] }),
  loc("f2-admin", "Congressman Office", "South Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "The Congressman Office is on the south side of the central corridor.",
  ], { floor: 2, category: "office", aliases: ["congressman", "congressman office", "congress"] }),
  loc("f2-legal", "Legal Department", "South Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "The Legal Department is beside the Congressman Office.",
  ], { floor: 2, category: "office", aliases: ["legal department", "2nd floor legal"] }),
  loc("f2-environment", "Environment and Natural Resources", "South Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "Environment and Natural Resources is on the south side of the 2nd floor, east of the Legal Department.",
  ], { floor: 2, category: "office", aliases: ["environment", "natural resources", "denr"] }),
  loc("f2-bac", "Bids and Award Committee Office", "South Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "The Bids and Award Committee Office is beside Environment and Natural Resources.",
  ], { floor: 2, category: "office", aliases: ["bac", "bids and awards", "bids and award committee"] }),
  loc("f2-accounting", "Accounting Department", "South Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "The Accounting Department is at the southeast corner of the 2nd floor.",
  ], { floor: 2, category: "office", aliases: ["accounting", "accounting department"] }),
  loc("f2-comfort-room", "Comfort Room", "West Wing", [
    "Take the elevator or stairs to the 2nd Floor.",
    "From the central corridor, walk to the west end near the elevators.",
    "The Male and Female comfort rooms are beside the west hallway spur.",
  ], { floor: 2, category: "facility", aliases: ["restroom", "comfort room", "cr", "toilet", "male", "female", "2nd floor comfort room", "second floor restroom"] }),

  // 3rd Floor
  loc("f3-information", "Information Office", "North Wing", [
    "Take the elevator or stairs to the 3rd Floor.",
    "The Information Office is the northwest room on the 3rd floor.",
  ], { floor: 3, category: "office", aliases: ["information office", "information", "3rd floor information"] }),
  loc("f3-sanggunian", "Sangguniang Panlalawigan Office", "North Wing", [
    "Take the elevator or stairs to the 3rd Floor.",
    "The Sangguniang Panlalawigan Office is on the north side of the 3rd floor, beside the Secretariat Office.",
  ], { floor: 3, category: "office", aliases: ["sangguniang panlalawigan", "sanggunian", "sp office"] }),
  loc("f3-secretariat", "Secretariat Office", "North Wing", [
    "Take the elevator or stairs to the 3rd Floor.",
    "The Secretariat Office is beside the Sangguniang Panlalawigan Office.",
  ], { floor: 3, category: "office", aliases: ["secretariat", "secretariat office"] }),
  loc("f3-session", "Session Hall", "North Wing", [
    "Take the elevator or stairs to the 3rd Floor.",
    "The Session Hall is on the north side of the 3rd floor.",
  ], { floor: 3, category: "office", aliases: ["session hall", "3rd floor session hall"] }),
  loc("f3-vice-governor", "Office of the Vice Governor", "North Wing", [
    "Take the elevator or stairs to the 3rd Floor.",
    "The Office of the Vice Governor is the northeast room on the 3rd floor.",
  ], { floor: 3, category: "office", aliases: ["vice governor", "office of the vice governor"] }),
  loc("f3-cpmc", "CPMC", "East Wing", [
    "Take the elevator or stairs to the 3rd Floor.",
    "CPMC is on the east side of the 3rd floor.",
  ], { floor: 3, category: "office", aliases: ["cpmc"] }),
  loc("f3-multipurpose", "Multi-Purpose Hall", "South Wing", [
    "Take the elevator or stairs to the 3rd Floor.",
    "The Multi-Purpose Hall is the southwest room on the 3rd floor.",
  ], { floor: 3, category: "office", aliases: ["multi-purpose hall", "multi purpose", "multipurpose", "mph"] }),
  loc("f3-archive", "Archive", "South Wing", [
    "Take the elevator or stairs to the 3rd Floor.",
    "The Archive is on the south side of the 3rd floor.",
  ], { floor: 3, category: "office", aliases: ["archive", "archives", "records"] }),
  loc("f3-comfort-room", "Comfort Room", "West Wing", [
    "Take the elevator or stairs to the 3rd Floor.",
    "From the central corridor, walk to the west end near the elevators.",
    "The Male and Female comfort rooms are beside the west hallway spur.",
  ], { floor: 3, category: "facility", aliases: ["restroom", "comfort room", "cr", "toilet", "male", "female", "3rd floor comfort room", "third floor restroom"] }),
];
