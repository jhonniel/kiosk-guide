import { pickLang, pickLocalizedArray, pickLocalizedText, type Language } from "@/lib/i18n/translations";
import type { BuildingLocationData } from "./types";
import type { NavNode } from "./navigation/types";

const FLOOR_NAMES: Record<number, { fil: string; bis: string }> = {
  1: { fil: "Unang Palapag", bis: "Unang Andana" },
  2: { fil: "Ikalawang Palapag", bis: "Ikaduhang Andana" },
  3: { fil: "Ikatlong Palapag", bis: "Ikatulong Andana" },
  4: { fil: "Ikaapat na Palapag", bis: "Ikaupat nga Andana" },
  5: { fil: "Ikalimang Palapag", bis: "Ikalimang Andana" },
};

const GENERIC_FLOOR_LABEL =
  /^(ground( floor)?|gf|lobby|(\d+)(st|nd|rd|th)? ?(floor|flr\.?|level)|(floor|level) ?\d+|(first|second|third|fourth|fifth) (floor|level))$/i;

const PLACE_LABELS: Record<string, { fil: string; bis: string }> = {
  "main entrance": { fil: "Pangunahing Pasukan", bis: "Pangunang Ganghaan" },
  "governor entrance": { fil: "Pasukan ng Gobernador", bis: "Ganghaan sa Gobernador" },
  "governor entrance ground floor": { fil: "Pasukan ng Gobernador", bis: "Ganghaan sa Gobernador" },
  "fire exit": { fil: "Labasan Pang-emergency", bis: "Gawasanan sa Emergency" },
  "fire exit ground floor back": {
    fil: "Labasan Pang-emergency (Likod)",
    bis: "Gawasanan sa Emergency (Likod)",
  },
  "emergency exit": { fil: "Labasan Pang-emergency", bis: "Gawasanan sa Emergency" },
  stairs: { fil: "Hagdan", bis: "Hagdanan" },
  "stairs (central)": { fil: "Hagdan (Gitna)", bis: "Hagdanan (Tunga)" },
  "stairs (east)": { fil: "Hagdan (Silangan)", bis: "Hagdanan (Sidlakan)" },
  "staircase a": { fil: "Hagdan A", bis: "Hagdanan A" },
  "staircase b": { fil: "Hagdan B", bis: "Hagdanan B" },
  "west corridor": { fil: "Kanlurang Pasilyo", bis: "Kasadpang Pasilyo" },
  "central west": { fil: "Gitnang-Kanlurang Pasilyo", bis: "Tunga-Kasadpang Pasilyo" },
  "central corridor": { fil: "Gitnang Pasilyo", bis: "Tungang Pasilyo" },
  "central east": { fil: "Gitnang-Silangang Pasilyo", bis: "Tunga-Sidlakang Pasilyo" },
  "east corridor": { fil: "Silangang Pasilyo", bis: "Sidlakang Pasilyo" },
  "south corridor": { fil: "Timog na Pasilyo", bis: "Habagatang Pasilyo" },
  "west hallway": { fil: "Kanlurang Pasilyo", bis: "Kasadpang Pasilyo" },
  "central hallway": { fil: "Gitnang Pasilyo", bis: "Tungang Pasilyo" },
  "east hallway": { fil: "Silangang Pasilyo", bis: "Sidlakang Pasilyo" },
  "male restroom": { fil: "Comfort Room ng Lalaki", bis: "Comfort Room sa Lalaki" },
  "female restroom": { fil: "Comfort Room ng Babae", bis: "Comfort Room sa Babaye" },
  "male comfort room": { fil: "Comfort Room ng Lalaki", bis: "Comfort Room sa Lalaki" },
  "female comfort room": { fil: "Comfort Room ng Babae", bis: "Comfort Room sa Babaye" },
};

const WING_LABELS: Record<string, { fil: string; bis: string }> = {
  "north wing": { fil: "Hilagang Bahagi", bis: "Amihanang Bahin" },
  "south wing": { fil: "Timog na Bahagi", bis: "Habagatang Bahin" },
  "east wing": { fil: "Silangang Bahagi", bis: "Sidlakang Bahin" },
  "west wing": { fil: "Kanlurang Bahagi", bis: "Kasadpang Bahin" },
};

function floorNumberWords(floor: number, lang: Language): string {
  const known = FLOOR_NAMES[floor];
  if (known) return pickLang(lang, "", known.fil, known.bis);
  return pickLang(lang, "", `Ika-${floor} na Palapag`, `Ika-${floor} nga Andana`);
}

export function localizeFloorLabel(label: string | undefined, floor: number, lang: Language): string {
  const english = label?.trim() || `Floor ${floor}`;
  if (lang === "en") return english;
  if (!GENERIC_FLOOR_LABEL.test(english)) return english;
  return floorNumberWords(floor, lang);
}

export function localizePlaceLabel(label: string, lang: Language): string {
  if (lang === "en" || !label) return label;
  const known = PLACE_LABELS[label.trim().toLowerCase()];
  if (known) return pickLang(lang, label, known.fil, known.bis);
  const room = /^Room (\S+)$/.exec(label.trim());
  if (room) return `${pickLang(lang, "Room", "Silid", "Kwarto")} ${room[1]}`;
  return label;
}

export function getRoomDisplay(room: string, lang: Language): string {
  const wing = WING_LABELS[room.trim().toLowerCase()];
  if (wing && lang !== "en") return pickLang(lang, room, wing.fil, wing.bis);
  return `${pickLang(lang, "Room", "Silid", "Kwarto")} ${room}`;
}

export function findLocationById(
  locations: BuildingLocationData[],
  locationId?: string
): BuildingLocationData | undefined {
  if (!locationId) return undefined;
  return locations.find((l) => l.id === locationId);
}

export function getLocationDisplay(
  location: BuildingLocationData,
  lang: Language
) {
  const name = pickLocalizedText(
    lang,
    location.nameEn,
    location.nameFil,
    location.nameBis
  );
  const floorLabel = pickLocalizedText(
    lang,
    location.floorLabelEn,
    location.floorLabelFil,
    location.floorLabelBis
  );
  const floor =
    lang !== "en" && floorLabel === location.floorLabelEn
      ? localizeFloorLabel(floorLabel, location.floor, lang)
      : floorLabel;
  const directions = pickLocalizedArray(
    lang,
    location.directionsEn,
    location.directionsFil,
    location.directionsBis
  );
  return { name, floor, directions };
}

export function getNodeFallbackDisplay(node: NavNode, lang: Language) {
  const englishFloor =
    node.floor === 1 ? "1st Floor" : node.floor === 2 ? "2nd Floor" : node.floor === 3 ? "3rd Floor" : `Floor ${node.floor}`;
  const floor = localizeFloorLabel(englishFloor, node.floor, lang);
  return { name: localizePlaceLabel(node.label, lang), floor, directions: [] as string[] };
}

const VERTICAL_INSTRUCTION =
  /^Take (the (?:(east|west|central) )?stairs|Staircase ([A-Z])|Elevator (\d+)|the elevator) to the (.+)\.$/i;

const FIXED_INSTRUCTIONS: Record<string, { fil: string; bis: string }> = {
  "Enter through the main doors at the bottom of the building.": {
    fil: "Pumasok sa mga pangunahing pinto sa ibabang bahagi ng gusali.",
    bis: "Sulod sa mga pangunang pultahan sa ubos nga bahin sa building.",
  },
  "Walk north into the main corridor.": {
    fil: "Dumiretso pahilaga papasok sa pangunahing pasilyo.",
    bis: "Diretso lang paamihanan padulong sa pangunang pasilyo.",
  },
  "Provincial Treasury Office is on the south side.": {
    fil: "Ang Provincial Treasury Office ay nasa timog na bahagi.",
    bis: "Ang Provincial Treasury Office naa sa habagatang bahin.",
  },
  "You are at the directory kiosk near the entrance.": {
    fil: "Nandito ka sa directory kiosk malapit sa pasukan.",
    bis: "Ania ka sa directory kiosk duol sa ganghaan.",
  },
  "Head to the elevator on your left.": {
    fil: "Pumunta sa elevator sa iyong kaliwa.",
    bis: "Adto sa elevator sa imong wala.",
  },
  "Take Staircase B.": {
    fil: "Gamitin ang Hagdan B.",
    bis: "Gamita ang Hagdanan B.",
  },
  "Continue past the Student Lounge.": {
    fil: "Dumiretso lampas sa Student Lounge.",
    bis: "Diretso lang lapas sa Student Lounge.",
  },
  "Turn right toward the Cafeteria.": {
    fil: "Lumiko sa kanan papunta sa Cafeteria.",
    bis: "Liko sa tuo paingon sa Cafeteria.",
  },
  "Walk past the Faculty Office.": {
    fil: "Dumiretso lampas sa Faculty Office.",
    bis: "Diretso lang lapas sa Faculty Office.",
  },
  "Room 205 is at the end of the hallway.": {
    fil: "Ang Silid 205 ay nasa dulo ng pasilyo.",
    bis: "Ang Kwarto 205 naa sa tumoy sa pasilyo.",
  },
  "Proceed to the Emergency Exit.": {
    fil: "Magtuloy sa Labasan Pang-emergency.",
    bis: "Padayon sa Gawasanan sa Emergency.",
  },
};

function floorFromLabel(label: string): number | null {
  const lower = label.trim().toLowerCase();
  if (/^(ground|1st|first)\b/.test(lower)) return 1;
  const digits = /(\d+)/.exec(lower);
  if (digits) return Number(digits[1]);
  if (lower.startsWith("second")) return 2;
  if (lower.startsWith("third")) return 3;
  return null;
}

export function localizeRouteInstruction(text: string, lang: Language): string {
  if (lang === "en") return text;
  const fixed = FIXED_INSTRUCTIONS[text];
  if (fixed) return pickLang(lang, text, fixed.fil, fixed.bis);

  const vertical = VERTICAL_INSTRUCTION.exec(text);
  if (vertical) {
    const [, via, side, staircase, elevatorNumber, floorText] = vertical;
    const floor = floorFromLabel(floorText);
    const target = floor ? localizeFloorLabel(floorText, floor, lang) : floorText;
    const sides: Record<string, { fil: string; bis: string }> = {
      east: { fil: "silangang ", bis: "sidlakang " },
      west: { fil: "kanlurang ", bis: "kasadpang " },
      central: { fil: "gitnang ", bis: "tungang " },
    };
    const sideWord = side ? sides[side.toLowerCase()] : undefined;
    if (elevatorNumber || /elevator/i.test(via)) {
      const name = elevatorNumber ? `Elevator ${elevatorNumber}` : "elevator";
      return pickLang(
        lang,
        text,
        `Sumakay sa ${name} papunta sa ${target}.`,
        `Sakay sa ${name} paingon sa ${target}.`
      );
    }
    if (staircase) {
      return pickLang(
        lang,
        text,
        `Gamitin ang Hagdan ${staircase} papunta sa ${target}.`,
        `Gamita ang Hagdanan ${staircase} paingon sa ${target}.`
      );
    }
    return pickLang(
      lang,
      text,
      `Gamitin ang ${sideWord?.fil ?? ""}hagdan papunta sa ${target}.`,
      `Gamita ang ${sideWord?.bis ?? ""}hagdanan paingon sa ${target}.`
    );
  }

  return text;
}

export function navigationErrorMessage(
  reason: "missing_destination" | "missing_map_node" | "missing_start" | "no_accessible_route" | "no_route",
  lang: Language
): string {
  switch (reason) {
    case "missing_destination":
      return pickLang(
        lang,
        "Destination not found in the building directory.",
        "Hindi nakita ang destinasyon sa direktoryo ng gusali.",
        "Wala makit-i ang destinasyon sa direktoryo sa building."
      );
    case "missing_map_node":
      return pickLang(
        lang,
        "No map coordinates for this destination. Showing text directions only.",
        "Wala pang lokasyon sa mapa ang destinasyong ito. Nakasulat na direksyon lang ang ipinapakita.",
        "Wala pay lokasyon sa mapa kini nga destinasyon. Sinulat nga direksyon lang ang gipakita."
      );
    case "missing_start":
      return pickLang(
        lang,
        "Starting location is not recognized. Please visit the Information Desk.",
        "Hindi makilala ang panimulang lokasyon. Mangyaring pumunta sa Information Desk.",
        "Wala mailhi ang sugdanan nga lokasyon. Palihug adto sa Information Desk."
      );
    case "no_accessible_route":
      return pickLang(
        lang,
        "No wheelchair-accessible route is available to this destination. Text directions are provided instead. Please visit the Information Desk for assistance.",
        "Walang rutang angkop sa wheelchair papunta sa destinasyong ito. Nakasulat na direksyon na lang ang ibinigay. Mangyaring pumunta sa Information Desk para sa tulong.",
        "Walay ruta nga angay sa wheelchair paingon niini nga destinasyon. Sinulat nga direksyon na lang ang gihatag. Palihug adto sa Information Desk para sa tabang."
      );
    case "no_route":
      return pickLang(
        lang,
        "No walkable route could be calculated. Text directions are provided instead. Please visit the Information Desk for assistance.",
        "Walang makitang daan na malalakaran. Nakasulat na direksyon na lang ang ibinigay. Mangyaring pumunta sa Information Desk para sa tulong.",
        "Walay nakit-an nga agianan nga malakaw. Sinulat nga direksyon na lang ang gihatag. Palihug adto sa Information Desk para sa tabang."
      );
  }
}
