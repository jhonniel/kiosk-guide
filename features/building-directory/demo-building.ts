import type { BuildingLocationData } from "./types";
import { DEMO_BUILDING_NAME_BIS, DEMO_LOCATION_BIS } from "./demo-building-bis";

export const DEMO_BUILDING_NAME_EN = "Demo Academic Building";
export const DEMO_BUILDING_NAME_FIL = "Demo Academic Building";

function loc(
  id: string,
  nameEn: string,
  floor: number,
  floorLabelEn: string,
  locationType: "room" | "facility",
  directionsEn: string[],
  opts?: {
    room?: string;
    nameFil?: string;
    nameBis?: string;
    floorLabelFil?: string;
    floorLabelBis?: string;
    category?: string;
    nearbyLandmarks?: string[];
    directionsFil?: string[];
    directionsBis?: string[];
    aliases?: string[];
  }
): BuildingLocationData {
  const bis = DEMO_LOCATION_BIS[id];
  return {
    id,
    buildingNameEn: DEMO_BUILDING_NAME_EN,
    buildingNameFil: DEMO_BUILDING_NAME_FIL,
    buildingNameBis: DEMO_BUILDING_NAME_BIS,
    nameEn,
    nameFil: opts?.nameFil,
    nameBis: opts?.nameBis ?? bis?.nameBis,
    floor,
    floorLabelEn,
    floorLabelFil: opts?.floorLabelFil ?? `${floor}${floor === 1 ? "st" : floor === 2 ? "nd" : "rd"} Floor`,
    floorLabelBis:
      opts?.floorLabelBis ??
      bis?.floorLabelBis ??
      (floor === 1 ? "Unang Palapag" : floor === 2 ? "Ikaduha nga Palapag" : "Ikatulo nga Palapag"),
    room: opts?.room,
    locationType,
    category: opts?.category,
    nearbyLandmarks: opts?.nearbyLandmarks ?? [],
    directionsEn,
    directionsFil: opts?.directionsFil,
    directionsBis: opts?.directionsBis ?? bis?.directionsBis,
    aliases: opts?.aliases,
  };
}

export const DEMO_BUILDING_LOCATIONS: BuildingLocationData[] = [
  // Floor 1 – Facilities
  loc("f1-main-entrance", "Main Entrance", 1, "1st Floor", "facility", [
    "You are at the Main Entrance — the primary entry point of the building.",
    "The directory kiosk is just inside to your right.",
    "The Information Desk is directly ahead.",
    "Staircase A is to your right; the elevator is to your left.",
  ], { category: "entrance", aliases: ["entrance", "main door", "lobby entrance"] }),

  loc("f1-kiosk", "Directory Kiosk", 1, "1st Floor", "facility", [
    "You are standing at the Directory Kiosk in the main lobby.",
    "The Information Desk is straight ahead.",
    "The Main Entrance is behind you.",
  ], { category: "service", nearbyLandmarks: ["Main Entrance", "Information Desk"], aliases: ["kiosk", "you are here", "directory"] }),

  loc("f1-info-desk", "Information Desk", 1, "1st Floor", "facility", [
    "Enter through the Main Entrance.",
    "Walk straight ahead.",
    "The Information Desk is directly in front of you in the main lobby.",
  ], { category: "service", nearbyLandmarks: ["Main Entrance", "Security Office"], aliases: ["information", "front desk", "help desk"] }),

  loc("f1-security", "Security Office", 1, "1st Floor", "facility", [
    "Enter through the Main Entrance.",
    "Walk straight to the Information Desk.",
    "The Security Office is on the right side of the lobby.",
  ], { category: "service", nearbyLandmarks: ["Information Desk", "Main Entrance"] }),

  loc("f1-student-lounge", "Student Lounge", 1, "1st Floor", "facility", [
    "Enter through the Main Entrance.",
    "Walk past the Information Desk.",
    "Turn left and continue down the hallway.",
    "The Student Lounge is on your left, beside the restrooms.",
  ], { category: "facility", nearbyLandmarks: ["Male Restroom", "Female Restroom"] }),

  loc("f1-cafeteria", "Cafeteria", 1, "1st Floor", "facility", [
    "Enter through the Main Entrance.",
    "Walk past the Information Desk.",
    "Turn right and follow the hallway.",
    "The Cafeteria is at the end of the corridor on your right.",
  ], { category: "dining", aliases: ["canteen", "food court", "dining"] }),

  loc("f1-elevator", "Elevator", 1, "1st Floor", "facility", [
    "Enter through the Main Entrance.",
    "The elevator is on your left side of the lobby.",
  ], { category: "vertical", aliases: ["lift", "elevators"] }),

  loc("f1-staircase-a", "Staircase A", 1, "1st Floor", "facility", [
    "Enter through the Main Entrance.",
    "Staircase A is on your right side of the lobby.",
  ], { category: "vertical", aliases: ["stairs a", "stairway a"] }),

  loc("f1-staircase-b", "Staircase B", 1, "1st Floor", "facility", [
    "Enter through the Main Entrance.",
    "Walk past the Information Desk.",
    "Turn left and continue to the end of the hallway.",
    "Staircase B is on your right.",
  ], { category: "vertical", aliases: ["stairs b", "stairway b"] }),

  loc("f1-male-restroom", "Male Restroom", 1, "1st Floor", "facility", [
    "On Floor 1, the Male Restroom is beside the Student Lounge.",
    "Enter through the Main Entrance, pass the Information Desk, turn left.",
    "The restroom is on your left before the Student Lounge.",
  ], { category: "restroom", nearbyLandmarks: ["Student Lounge"], aliases: ["men's room", "mens restroom", "male cr", "male toilet"] }),

  loc("f1-female-restroom", "Female Restroom", 1, "1st Floor", "facility", [
    "On Floor 1, the Female Restroom is beside the Student Lounge.",
    "Enter through the Main Entrance, pass the Information Desk, turn left.",
    "The restroom is on your left next to the Male Restroom.",
  ], { category: "restroom", nearbyLandmarks: ["Student Lounge"], aliases: ["women's room", "womens restroom", "female cr", "female toilet"] }),

  // Floor 1 – Rooms
  loc("r101", "Admissions Office", 1, "1st Floor", "room", [
    "Enter through the Main Entrance.",
    "Walk straight to the Information Desk.",
    "Continue along the hallway.",
    "Room 101 – Admissions Office is on your right.",
  ], { room: "101", nearbyLandmarks: ["Registrar's Office", "Information Desk"], aliases: ["admissions", "admission office"] }),

  loc("r102", "Registrar's Office", 1, "1st Floor", "room", [
    "Enter through the Main Entrance.",
    "Walk straight to the Information Desk.",
    "Continue along the hallway.",
    "Room 102 – Registrar's Office is on your right, beside the Admissions Office.",
  ], { room: "102", nearbyLandmarks: ["Admissions Office", "Cashier"], aliases: ["registrar", "registrar office"] }),

  loc("r103", "Cashier", 1, "1st Floor", "room", [
    "Enter through the Main Entrance.",
    "Walk straight to the Information Desk.",
    "Continue along the hallway.",
    "Room 103 – Cashier is on your right, next to the Registrar's Office.",
  ], { room: "103", nearbyLandmarks: ["Registrar's Office", "Clinic"], aliases: ["cashier office", "payments", "billing"] }),

  loc("r104", "Clinic", 1, "1st Floor", "room", [
    "Enter through the Main Entrance.",
    "Walk straight to the Information Desk.",
    "Continue along the hallway.",
    "Room 104 – Clinic is on your right, past the Cashier.",
  ], { room: "104", nearbyLandmarks: ["Cashier", "Guidance Office"], aliases: ["health clinic", "medical clinic", "nurse"] }),

  loc("r105", "Guidance Office", 1, "1st Floor", "room", [
    "Enter through the Main Entrance.",
    "Walk straight to the Information Desk.",
    "Continue along the hallway.",
    "Room 105 – Guidance Office is at the end of the corridor on your right.",
  ], { room: "105", nearbyLandmarks: ["Clinic"], aliases: ["guidance", "counseling", "counselor"] }),

  // Floor 2 – Facilities
  loc("f2-elevator", "Elevator", 2, "2nd Floor", "facility", [
    "Take the elevator from the 1st Floor lobby.",
    "Exit on the 2nd Floor — the elevator opens to the main hallway.",
  ], { category: "vertical", aliases: ["lift", "elevators"] }),

  loc("f2-staircase-a", "Staircase A", 2, "2nd Floor", "facility", [
    "Use Staircase A from the 1st Floor lobby.",
    "Climb to the 2nd Floor.",
    "Exit onto the main hallway.",
  ], { category: "vertical", aliases: ["stairs a", "stairway a"] }),

  loc("f2-staircase-b", "Staircase B", 2, "2nd Floor", "facility", [
    "Use Staircase B from the 1st Floor.",
    "Climb to the 2nd Floor.",
    "Exit onto the hallway near the laboratories.",
  ], { category: "vertical", aliases: ["stairs b", "stairway b"] }),

  loc("f2-water-station", "Water Station", 2, "2nd Floor", "facility", [
    "Go to the 2nd Floor via the elevator or Staircase A.",
    "Exit and turn left.",
    "The Water Station is next to the restrooms.",
  ], { category: "facility", nearbyLandmarks: ["Elevator", "Male Restroom"] }),

  loc("f2-male-restroom", "Male Restroom", 2, "2nd Floor", "facility", [
    "On Floor 2, the Male Restroom is next to the Elevator.",
    "Take the elevator to the 2nd Floor.",
    "Exit the elevator — the restroom is immediately to your right.",
  ], { category: "restroom", nearbyLandmarks: ["Elevator", "Water Station"], aliases: ["men's room", "mens restroom"] }),

  loc("f2-female-restroom", "Female Restroom", 2, "2nd Floor", "facility", [
    "On Floor 2, the Female Restroom is next to the Elevator.",
    "Take the elevator to the 2nd Floor.",
    "Exit the elevator — the restroom is immediately to your left.",
  ], { category: "restroom", nearbyLandmarks: ["Elevator", "Water Station"], aliases: ["women's room", "womens restroom"] }),

  // Floor 2 – Rooms
  loc("r201", "Computer Laboratory", 2, "2nd Floor", "room", [
    "Go to the elevator or Staircase A.",
    "Proceed to the 2nd Floor.",
    "Turn right from the elevator.",
    "Room 201 – Computer Laboratory is the first room on your right.",
  ], { room: "201", nearbyLandmarks: ["Physics Laboratory", "Elevator"], aliases: ["computer lab", "computer room", "ict lab"] }),

  loc("r202", "Physics Laboratory", 2, "2nd Floor", "room", [
    "Go to the elevator or Staircase A.",
    "Proceed to the 2nd Floor.",
    "Turn right from the elevator.",
    "Room 202 – Physics Laboratory is next to the Computer Laboratory.",
  ], { room: "202", nearbyLandmarks: ["Computer Laboratory", "Faculty Office"], aliases: ["physics lab", "science lab"] }),

  loc("r203", "Faculty Office", 2, "2nd Floor", "room", [
    "Go to the elevator or Staircase A.",
    "Proceed to the 2nd Floor.",
    "Turn left from the elevator.",
    "Room 203 – Faculty Office is along the hallway on your left.",
  ], { room: "203", nearbyLandmarks: ["Library", "Conference Room"], aliases: ["faculty room", "teachers office"] }),

  loc("r204", "Conference Room", 2, "2nd Floor", "room", [
    "Go to the elevator or Staircase A.",
    "Proceed to the 2nd Floor.",
    "Turn left and walk past the Faculty Office.",
    "Room 204 – Conference Room is on your left.",
  ], { room: "204", nearbyLandmarks: ["Faculty Office", "Library"], aliases: ["meeting room", "conference hall"] }),

  loc("r205", "Library", 2, "2nd Floor", "room", [
    "Go to the elevator or Staircase A.",
    "Proceed to the 2nd Floor.",
    "Turn left.",
    "Walk past the Faculty Office.",
    "Room 205 – Library is at the end of the hallway.",
  ], { room: "205", nearbyLandmarks: ["Faculty Office", "Conference Room"], aliases: ["library room", "reading room"] }),

  // Floor 3 – Facilities
  loc("f3-elevator", "Elevator", 3, "3rd Floor", "facility", [
    "Take the elevator from the 1st Floor lobby.",
    "Proceed to the 3rd Floor.",
    "Exit onto the main hallway.",
  ], { category: "vertical", aliases: ["lift"] }),

  loc("f3-staircase-a", "Staircase A", 3, "3rd Floor", "facility", [
    "Use Staircase A from the 1st Floor lobby.",
    "Climb to the 3rd Floor.",
  ], { category: "vertical", aliases: ["stairs a"] }),

  loc("f3-staircase-b", "Staircase B", 3, "3rd Floor", "facility", [
    "Use Staircase B from the 1st Floor.",
    "Climb to the 3rd Floor.",
  ], { category: "vertical", aliases: ["stairs b"] }),

  loc("f3-emergency-exit", "Emergency Exit", 3, "3rd Floor", "facility", [
    "Go to the 3rd Floor via Staircase A or the elevator.",
    "The Emergency Exit is at the far end of the hallway, past Lecture Hall B.",
    "Follow official emergency procedures and building announcements during an evacuation.",
  ], { category: "emergency", nearbyLandmarks: ["Lecture Hall B", "Staircase A"], aliases: ["fire exit", "evacuation exit", "emergency door"] }),

  loc("f3-male-restroom", "Male Restroom", 3, "3rd Floor", "facility", [
    "On Floor 3, the Male Restroom is across from the Dean's Office.",
    "Take the elevator to the 3rd Floor.",
    "Exit and walk straight — the restroom is on your right.",
  ], { category: "restroom", nearbyLandmarks: ["Dean's Office"], aliases: ["men's room"] }),

  loc("f3-female-restroom", "Female Restroom", 3, "3rd Floor", "facility", [
    "On Floor 3, the Female Restroom is across from the Dean's Office.",
    "Take the elevator to the 3rd Floor.",
    "Exit and walk straight — the restroom is on your left.",
  ], { category: "restroom", nearbyLandmarks: ["Dean's Office"], aliases: ["women's room"] }),

  // Floor 3 – Rooms
  loc("r301", "Dean's Office", 3, "3rd Floor", "room", [
    "Go to the elevator or Staircase A.",
    "Proceed to the 3rd Floor.",
    "Exit the elevator and walk straight.",
    "Room 301 – Dean's Office is directly ahead on your right.",
  ], { room: "301", nearbyLandmarks: ["Research Office", "Female Restroom"], aliases: ["dean office", "dean"] }),

  loc("r302", "Research Office", 3, "3rd Floor", "room", [
    "Go to the elevator or Staircase A.",
    "Proceed to the 3rd Floor.",
    "Exit and turn right.",
    "Room 302 – Research Office is the first room on your right.",
  ], { room: "302", nearbyLandmarks: ["Dean's Office", "Multimedia Room"], aliases: ["research", "research lab"] }),

  loc("r303", "Multimedia Room", 3, "3rd Floor", "room", [
    "Go to the elevator or Staircase A.",
    "Proceed to the 3rd Floor.",
    "Exit and turn right.",
    "Room 303 – Multimedia Room is next to the Research Office.",
  ], { room: "303", nearbyLandmarks: ["Research Office", "Lecture Hall A"], aliases: ["multimedia lab", "media room"] }),

  loc("r304", "Lecture Hall A", 3, "3rd Floor", "room", [
    "Go to the elevator or Staircase A.",
    "Proceed to the 3rd Floor.",
    "Exit and turn right.",
    "Walk down the hallway.",
    "Room 304 – Lecture Hall A is on your right.",
  ], { room: "304", nearbyLandmarks: ["Multimedia Room", "Lecture Hall B"], aliases: ["lecture room a", "hall a"] }),

  loc("r305", "Lecture Hall B", 3, "3rd Floor", "room", [
    "Go to the elevator or Staircase A.",
    "Proceed to the 3rd Floor.",
    "Exit and turn right.",
    "Walk to the end of the hallway.",
    "Room 305 – Lecture Hall B is on your right, near the Emergency Exit.",
  ], { room: "305", nearbyLandmarks: ["Lecture Hall A", "Emergency Exit"], aliases: ["lecture room b", "hall b"] }),
];

export const DEMO_FLOOR_SUMMARY = [
  { floor: 1, label: "Floor 1", facilities: 10, rooms: 5 },
  { floor: 2, label: "Floor 2", facilities: 6, rooms: 5 },
  { floor: 3, label: "Floor 3", facilities: 6, rooms: 5 },
];
