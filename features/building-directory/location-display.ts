import { pickLocalizedArray, pickLocalizedText, type Language } from "@/lib/i18n/translations";
import { uiText } from "@/lib/i18n/kiosk-ui";
import type { BuildingLocationData } from "./types";
import type { NavNode } from "./navigation/types";

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
  const floor = pickLocalizedText(
    lang,
    location.floorLabelEn,
    location.floorLabelFil,
    location.floorLabelBis
  );
  const directions = pickLocalizedArray(
    lang,
    location.directionsEn,
    location.directionsFil,
    location.directionsBis
  );
  return { name, floor, directions };
}

export function getNodeFallbackDisplay(node: NavNode, lang: Language) {
  const floorLabels: Record<number, { en: string; fil: string; bis: string }> = {
    1: { en: "1st Floor", fil: "1st Floor", bis: uiText("bis", "firstFloor") },
    2: { en: "2nd Floor", fil: "2nd Floor", bis: uiText("bis", "secondFloor") },
    3: { en: "3rd Floor", fil: "3rd Floor", bis: uiText("bis", "thirdFloor") },
  };
  const labels = floorLabels[node.floor];
  const floor =
    lang === "fil"
      ? labels?.fil ?? `Floor ${node.floor}`
      : lang === "bis"
        ? labels?.bis ?? `Floor ${node.floor}`
        : labels?.en ?? `Floor ${node.floor}`;
  return { name: node.label, floor, directions: [] as string[] };
}
