import type { BuildingLocationData } from "./types";

export const CAPITOL_BUILDING_NAME_EN = "Provincial Capitol Building";
export const CAPITOL_BUILDING_NAME_FIL = "Capitol Building";
export const CAPITOL_BUILDING_NAME_BIS = "Capitol Building";

const ENTER_FIL = "Pumasok sa gitnang pasilyo.";
const ENTER_BIS = "Sulod sa tungang pasilyo.";
const WEST_FIL = "Pumasok sa gitnang pasilyo at maglakad pakanluran.";
const WEST_BIS = "Sulod sa tungang pasilyo ug lakaw pakasadpan.";
const EAST_FIL = "Pumasok sa gitnang pasilyo at maglakad pasilangan.";
const EAST_BIS = "Sulod sa tungang pasilyo ug lakaw pasidlakan.";
const EAST_END_FIL = "Pumasok sa gitnang pasilyo at maglakad hanggang sa dulong silangan.";
const EAST_END_BIS = "Sulod sa tungang pasilyo ug lakaw hangtod sa tumoy sa sidlakan.";
const UP_2_FIL = "Sumakay sa elevator o umakyat sa hagdan papunta sa Ikalawang Palapag.";
const UP_2_BIS = "Sakay sa elevator o saka sa hagdanan paingon sa Ikaduhang Andana.";
const UP_3_FIL = "Sumakay sa elevator o umakyat sa hagdan papunta sa Ikatlong Palapag.";
const UP_3_BIS = "Sakay sa elevator o saka sa hagdanan paingon sa Ikatulong Andana.";
const WEST_END_FIL = "Mula sa gitnang pasilyo, maglakad hanggang sa dulong kanluran malapit sa mga elevator.";
const WEST_END_BIS = "Gikan sa tungang pasilyo, lakaw hangtod sa tumoy sa kasadpan duol sa mga elevator.";
const UPPER_CR_FIL = "Ang Comfort Room ng lalaki at babae ay nasa tabi ng sangang pasilyo sa kanluran.";
const UPPER_CR_BIS = "Ang Comfort Room sa lalaki ug babaye naa sa tupad sa sanga sa pasilyo sa kasadpan.";

const CAPITOL_LOCATION_TRANSLATIONS: Record<
  string,
  { nameFil?: string; nameBis?: string; directionsFil: string[]; directionsBis: string[] }
> = {
  "gf-governor-entrance": {
    nameFil: "Pasukan ng Gobernador (Unang Palapag)",
    nameBis: "Ganghaan sa Gobernador (Unang Andana)",
    directionsFil: [
      "Nandito ka sa Pasukan ng Gobernador sa Unang Palapag.",
      "Dumiretso para marating ang gitnang pasilyo at ang directory kiosk.",
    ],
    directionsBis: [
      "Ania ka sa Ganghaan sa Gobernador sa Unang Andana.",
      "Diretso lang aron maabot ang tungang pasilyo ug ang directory kiosk.",
    ],
  },
  "gf-kiosk": {
    directionsFil: [
      "Nandito ka sa Building Directory kiosk sa gitnang pasilyo.",
      "Mula sa pasilyong ito matatagpuan ang lahat ng opisina ng probinsya sa Unang Palapag.",
    ],
    directionsBis: [
      "Ania ka sa Building Directory kiosk sa tungang pasilyo.",
      "Gikan niini nga pasilyo makit-an ang tanang opisina sa probinsya sa Unang Andana.",
    ],
  },
  "gf-fire-exit": {
    nameFil: "Labasan Pang-emergency (Likod, Unang Palapag)",
    nameBis: "Gawasanan sa Emergency (Likod, Unang Andana)",
    directionsFil: [
      "Ang labasan pang-emergency ay nasa likod ng gusali malapit sa Provincial Veterinary Office.",
      "Gamitin lamang kapag may emergency.",
    ],
    directionsBis: [
      "Ang gawasanan sa emergency naa sa likod sa building duol sa Provincial Veterinary Office.",
      "Gamita lang kung adunay emergency.",
    ],
  },
  "gf-elevator-1": {
    directionsFil: ["Mula sa gitnang pasilyo, ang Elevator 1 ay nasa kanlurang bahagi kasama ng iba pang elevator."],
    directionsBis: ["Gikan sa tungang pasilyo, ang Elevator 1 naa sa kasadpang bahin uban sa ubang mga elevator."],
  },
  "gf-elevator-2": {
    directionsFil: ["Mula sa gitnang pasilyo, ang Elevator 2 ay katabi ng Elevator 1 sa kanlurang bahagi."],
    directionsBis: ["Gikan sa tungang pasilyo, ang Elevator 2 naa sa tupad sa Elevator 1 sa kasadpang bahin."],
  },
  "gf-stair-a": {
    nameFil: "Hagdan (Gitna)",
    nameBis: "Hagdanan (Tunga)",
    directionsFil: ["Mula sa gitnang pasilyo, ang hagdan ay nasa kaliwang bahagi ng gitna ng pasilyo."],
    directionsBis: ["Gikan sa tungang pasilyo, ang hagdanan naa sa wala nga bahin sa tunga sa pasilyo."],
  },
  "gf-stair-b": {
    nameFil: "Hagdan (Silangan)",
    nameBis: "Hagdanan (Sidlakan)",
    directionsFil: ["Mula sa gitnang pasilyo, ang ikalawang hagdan ay nasa kanang bahagi ng gitna ng pasilyo."],
    directionsBis: ["Gikan sa tungang pasilyo, ang ikaduhang hagdanan naa sa tuo nga bahin sa tunga sa pasilyo."],
  },
  "gf-comfort-room": {
    directionsFil: [WEST_END_FIL, "Ang Comfort Room ay ang silid sa tabi ng sangang pasilyo sa kanluran."],
    directionsBis: [WEST_END_BIS, "Ang Comfort Room mao ang kwarto sa tupad sa sanga sa pasilyo sa kasadpan."],
  },
  "gf-veterinary": {
    directionsFil: [
      "Pumasok sa gitnang pasilyo mula sa kiosk.",
      "Maglakad pakanluran at lumiko pahilaga — ang Provincial Veterinary Office ay nasa hilagang-kanlurang sulok.",
    ],
    directionsBis: [
      "Sulod sa tungang pasilyo gikan sa kiosk.",
      "Lakaw pakasadpan ug liko paamihanan — ang Provincial Veterinary Office naa sa amihanang-kasadpang eskina.",
    ],
  },
  "gf-agriculture": {
    directionsFil: [WEST_FIL, "Ang Provincial Agriculture Office ay nasa hilagang bahagi ng Unang Palapag."],
    directionsBis: [WEST_BIS, "Ang Provincial Agriculture Office naa sa amihanang bahin sa Unang Andana."],
  },
  "gf-general-services": {
    directionsFil: [ENTER_FIL, "Ang Provincial General Services Office ay nasa hilagang bahagi, sa gitna ng gusali."],
    directionsBis: [ENTER_BIS, "Ang Provincial General Services Office naa sa amihanang bahin, sa tunga sa building."],
  },
  "gf-budget": {
    directionsFil: [EAST_FIL, "Ang Provincial Budget Office ay nasa hilagang bahagi ng Unang Palapag."],
    directionsBis: [EAST_BIS, "Ang Provincial Budget Office naa sa amihanang bahin sa Unang Andana."],
  },
  "gf-health": {
    directionsFil: [EAST_END_FIL, "Ang Provincial Health Office ay nasa hilagang-silangang sulok ng Unang Palapag."],
    directionsBis: [EAST_END_BIS, "Ang Provincial Health Office naa sa amihanang-sidlakang eskina sa Unang Andana."],
  },
  "gf-conference": {
    directionsFil: [EAST_FIL, "Ang PDRRMO ay nasa silangang bahagi ng Unang Palapag."],
    directionsBis: [EAST_BIS, "Ang PDRRMO naa sa sidlakang bahin sa Unang Andana."],
  },
  "gf-social-welfare": {
    directionsFil: [WEST_FIL, "Ang Provincial Social Welfare and Development Office ay nasa timog-kanlurang bahagi ng Unang Palapag."],
    directionsBis: [WEST_BIS, "Ang Provincial Social Welfare and Development Office naa sa habagatang-kasadpang bahin sa Unang Andana."],
  },
  "gf-assessor": {
    directionsFil: [ENTER_FIL, "Ang Provincial Assessor's Office ay nasa timog na bahagi ng Unang Palapag."],
    directionsBis: [ENTER_BIS, "Ang Provincial Assessor's Office naa sa habagatang bahin sa Unang Andana."],
  },
  "gf-people-assistance": {
    directionsFil: [ENTER_FIL, "Ang People Assistance Office ay nasa timog na bahagi malapit sa gitna ng gusali."],
    directionsBis: [ENTER_BIS, "Ang People Assistance Office naa sa habagatang bahin duol sa tunga sa building."],
  },
  "gf-treasury": {
    directionsFil: [EAST_FIL, "Ang Provincial Treasury Office ay nasa timog na bahagi ng Unang Palapag."],
    directionsBis: [EAST_BIS, "Ang Provincial Treasury Office naa sa habagatang bahin sa Unang Andana."],
  },
  "gf-tourism": {
    directionsFil: [EAST_END_FIL, "Ang Provincial Tourism Office ay nasa timog-silangang sulok ng Unang Palapag."],
    directionsBis: [EAST_END_BIS, "Ang Provincial Tourism Office naa sa habagatang-sidlakang eskina sa Unang Andana."],
  },
  "f2-governor": {
    directionsFil: [
      "Sumakay sa Elevator 1 o umakyat sa hagdan papunta sa Ikalawang Palapag.",
      "Ang Governor's Office ay ang silid sa timog-kanluran ng Ikalawang Palapag.",
    ],
    directionsBis: [
      "Sakay sa Elevator 1 o saka sa hagdanan paingon sa Ikaduhang Andana.",
      "Ang Governor's Office mao ang kwarto sa habagatang-kasadpan sa Ikaduhang Andana.",
    ],
  },
  "f2-administrator": {
    directionsFil: [UP_2_FIL, "Ang Administrator Office ay ang silid na katabi ng Governor's Office."],
    directionsBis: [UP_2_BIS, "Ang Administrator Office mao ang kwarto nga tupad sa Governor's Office."],
  },
  "f2-engineering": {
    directionsFil: [UP_2_FIL, "Ang Provincial Engineering Department ay ang silid sa hilagang-kanluran ng Ikalawang Palapag."],
    directionsBis: [UP_2_BIS, "Ang Provincial Engineering Department mao ang kwarto sa amihanang-kasadpan sa Ikaduhang Andana."],
  },
  "f2-peso": {
    directionsFil: [UP_2_FIL, "Ang Public Employment Services Office Department ay nasa hilagang bahagi ng Ikalawang Palapag."],
    directionsBis: [UP_2_BIS, "Ang Public Employment Services Office Department naa sa amihanang bahin sa Ikaduhang Andana."],
  },
  "f2-planning": {
    directionsFil: [UP_2_FIL, "Ang Provincial Planning Development Department ay nasa dalawang gitnang silid sa hilagang bahagi ng Ikalawang Palapag."],
    directionsBis: [UP_2_BIS, "Ang Provincial Planning Development Department naa sa duha ka tungang kwarto sa amihanang bahin sa Ikaduhang Andana."],
  },
  "f2-audit": {
    directionsFil: [UP_2_FIL, "Ang Internal Audit Services ay nasa hilagang-silangang bahagi ng Ikalawang Palapag."],
    directionsBis: [UP_2_BIS, "Ang Internal Audit Services naa sa amihanang-sidlakang bahin sa Ikaduhang Andana."],
  },
  "f2-conference": {
    directionsFil: [UP_2_FIL, "Ang Conference Room ay nasa silangang bahagi ng Ikalawang Palapag."],
    directionsBis: [UP_2_BIS, "Ang Conference Room naa sa sidlakang bahin sa Ikaduhang Andana."],
  },
  "f2-admin": {
    directionsFil: [UP_2_FIL, "Ang Congressman Office ay nasa timog na bahagi ng gitnang pasilyo."],
    directionsBis: [UP_2_BIS, "Ang Congressman Office naa sa habagatang bahin sa tungang pasilyo."],
  },
  "f2-legal": {
    directionsFil: [UP_2_FIL, "Ang Legal Department ay katabi ng Congressman Office."],
    directionsBis: [UP_2_BIS, "Ang Legal Department naa sa tupad sa Congressman Office."],
  },
  "f2-environment": {
    directionsFil: [UP_2_FIL, "Ang Environment and Natural Resources ay nasa timog na bahagi ng Ikalawang Palapag, sa silangan ng Legal Department."],
    directionsBis: [UP_2_BIS, "Ang Environment and Natural Resources naa sa habagatang bahin sa Ikaduhang Andana, sa sidlakan sa Legal Department."],
  },
  "f2-bac": {
    directionsFil: [UP_2_FIL, "Ang Bids and Award Committee Office ay katabi ng Environment and Natural Resources."],
    directionsBis: [UP_2_BIS, "Ang Bids and Award Committee Office naa sa tupad sa Environment and Natural Resources."],
  },
  "f2-accounting": {
    directionsFil: [UP_2_FIL, "Ang Accounting Department ay nasa timog-silangang sulok ng Ikalawang Palapag."],
    directionsBis: [UP_2_BIS, "Ang Accounting Department naa sa habagatang-sidlakang eskina sa Ikaduhang Andana."],
  },
  "f2-comfort-room": {
    directionsFil: [UP_2_FIL, WEST_END_FIL, UPPER_CR_FIL],
    directionsBis: [UP_2_BIS, WEST_END_BIS, UPPER_CR_BIS],
  },
  "f3-information": {
    directionsFil: [UP_3_FIL, "Ang Information Office ay ang silid sa hilagang-kanluran ng Ikatlong Palapag."],
    directionsBis: [UP_3_BIS, "Ang Information Office mao ang kwarto sa amihanang-kasadpan sa Ikatulong Andana."],
  },
  "f3-sanggunian": {
    directionsFil: [UP_3_FIL, "Ang Sangguniang Panlalawigan Office ay nasa hilagang bahagi ng Ikatlong Palapag, katabi ng Secretariat Office."],
    directionsBis: [UP_3_BIS, "Ang Sangguniang Panlalawigan Office naa sa amihanang bahin sa Ikatulong Andana, tupad sa Secretariat Office."],
  },
  "f3-secretariat": {
    directionsFil: [UP_3_FIL, "Ang Secretariat Office ay katabi ng Sangguniang Panlalawigan Office."],
    directionsBis: [UP_3_BIS, "Ang Secretariat Office naa sa tupad sa Sangguniang Panlalawigan Office."],
  },
  "f3-session": {
    directionsFil: [UP_3_FIL, "Ang Session Hall ay nasa hilagang bahagi ng Ikatlong Palapag."],
    directionsBis: [UP_3_BIS, "Ang Session Hall naa sa amihanang bahin sa Ikatulong Andana."],
  },
  "f3-vice-governor": {
    directionsFil: [UP_3_FIL, "Ang Office of the Vice Governor ay ang silid sa hilagang-silangan ng Ikatlong Palapag."],
    directionsBis: [UP_3_BIS, "Ang Office of the Vice Governor mao ang kwarto sa amihanang-sidlakan sa Ikatulong Andana."],
  },
  "f3-cpmc": {
    directionsFil: [UP_3_FIL, "Ang CPMC ay nasa silangang bahagi ng Ikatlong Palapag."],
    directionsBis: [UP_3_BIS, "Ang CPMC naa sa sidlakang bahin sa Ikatulong Andana."],
  },
  "f3-multipurpose": {
    directionsFil: [UP_3_FIL, "Ang Multi-Purpose Hall ay ang silid sa timog-kanluran ng Ikatlong Palapag."],
    directionsBis: [UP_3_BIS, "Ang Multi-Purpose Hall mao ang kwarto sa habagatang-kasadpan sa Ikatulong Andana."],
  },
  "f3-archive": {
    directionsFil: [UP_3_FIL, "Ang Archive ay nasa timog na bahagi ng Ikatlong Palapag."],
    directionsBis: [UP_3_BIS, "Ang Archive naa sa habagatang bahin sa Ikatulong Andana."],
  },
  "f3-comfort-room": {
    directionsFil: [UP_3_FIL, WEST_END_FIL, UPPER_CR_FIL],
    directionsBis: [UP_3_BIS, WEST_END_BIS, UPPER_CR_BIS],
  },
};

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
  const floorLabelFil =
    opts?.floorLabelFil ?? (floor === 1 ? "Unang Palapag" : floor === 2 ? "Ikalawang Palapag" : "Ikatlong Palapag");
  const floorLabelBis =
    opts?.floorLabelBis ?? (floor === 1 ? "Unang Andana" : floor === 2 ? "Ikaduhang Andana" : "Ikatulong Andana");
  const translated = CAPITOL_LOCATION_TRANSLATIONS[id];
  return {
    id,
    buildingNameEn: CAPITOL_BUILDING_NAME_EN,
    buildingNameFil: CAPITOL_BUILDING_NAME_FIL,
    buildingNameBis: CAPITOL_BUILDING_NAME_BIS,
    nameEn,
    nameFil: opts?.nameFil ?? translated?.nameFil,
    nameBis: translated?.nameBis,
    floor,
    floorLabelEn,
    floorLabelFil,
    floorLabelBis,
    room,
    locationType: "room",
    category: opts?.category,
    nearbyLandmarks: opts?.nearbyLandmarks ?? [],
    directionsEn,
    directionsFil: translated?.directionsFil,
    directionsBis: translated?.directionsBis,
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
  const translated = CAPITOL_LOCATION_TRANSLATIONS[id];
  return {
    id,
    buildingNameEn: CAPITOL_BUILDING_NAME_EN,
    buildingNameFil: CAPITOL_BUILDING_NAME_FIL,
    buildingNameBis: CAPITOL_BUILDING_NAME_BIS,
    nameEn,
    nameFil: translated?.nameFil,
    nameBis: translated?.nameBis,
    floor: 1,
    floorLabelEn: "Ground Floor",
    floorLabelFil: "Unang Palapag",
    floorLabelBis: "Unang Andana",
    locationType: "facility",
    category: opts?.category,
    nearbyLandmarks: opts?.nearbyLandmarks ?? [],
    directionsEn,
    directionsFil: translated?.directionsFil,
    directionsBis: translated?.directionsBis,
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
