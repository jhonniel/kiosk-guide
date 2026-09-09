import { db } from "@/lib/db";
import type { Language } from "@/lib/i18n/translations";
import {
  CAPITOL_BUILDING_LOCATIONS,
  CAPITOL_BUILDING_NAME_EN,
} from "./capitol-building";
import { getLocationDisplay } from "./location-display";
import {
  getLocalizedSetting,
  getResolvedSettings,
  getSetting,
} from "@/features/settings/resolve-settings";
import type { BuildingLocationData, GuideContext, GuideResponse } from "./types";
import {
  askBuildingGuide,
  resolveBuildingGuideWithContext,
  scoreMatch,
} from "./guide-logic";

export { askBuildingGuide, resolveBuildingGuideWithContext } from "./guide-logic";

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function dbLocationToData(row: {
  id: string;
  buildingNameEn: string;
  buildingNameFil: string | null;
  buildingNameBis?: string | null;
  nameEn: string;
  nameFil: string | null;
  nameBis?: string | null;
  floor: number;
  floorLabelEn: string;
  floorLabelFil: string | null;
  floorLabelBis?: string | null;
  room: string | null;
  locationType: string;
  category: string | null;
  nearbyLandmarks: string;
  directionsEn: string;
  directionsFil: string | null;
  directionsBis?: string | null;
  aliases: string | null;
}): BuildingLocationData {
  return {
    id: row.id,
    buildingNameEn: row.buildingNameEn,
    buildingNameFil: row.buildingNameFil ?? undefined,
    buildingNameBis: row.buildingNameBis ?? undefined,
    nameEn: row.nameEn,
    nameFil: row.nameFil ?? undefined,
    nameBis: row.nameBis ?? undefined,
    floor: row.floor,
    floorLabelEn: row.floorLabelEn,
    floorLabelFil: row.floorLabelFil ?? undefined,
    floorLabelBis: row.floorLabelBis ?? undefined,
    room: row.room ?? undefined,
    locationType: row.locationType as "room" | "facility",
    category: row.category ?? undefined,
    nearbyLandmarks: parseJsonArray(row.nearbyLandmarks),
    directionsEn: parseJsonArray(row.directionsEn),
    directionsFil: parseJsonArray(row.directionsFil),
    directionsBis: parseJsonArray(row.directionsBis),
    aliases: parseJsonArray(row.aliases),
  };
}

export async function getGuideContext(): Promise<GuideContext> {
  const settings = await getResolvedSettings();
  const buildingName = getSetting(settings, "building_name_en", CAPITOL_BUILDING_NAME_EN);
  const demoNotice = getSetting(settings, "building_demo_notice_en");
  const missingLocationMessage = getSetting(settings, "building_missing_location_en");

  const rows = await db.buildingLocation.findMany({
    where: { isActive: true },
    orderBy: [{ floor: "asc" }, { sortOrder: "asc" }],
  });

  return {
    isDemoMode: false,
    buildingName: rows[0]?.buildingNameEn ?? buildingName,
    locations: rows.length > 0 ? rows.map(dbLocationToData) : CAPITOL_BUILDING_LOCATIONS,
    demoNotice,
    missingLocationMessage,
  };
}

export async function resolveBuildingGuide(
  query: string,
  lang: Language = "en",
  locationId?: string
): Promise<GuideResponse> {
  const context = await getGuideContext();
  const settings = await getResolvedSettings();
  const localizedContext: GuideContext = {
    ...context,
    buildingName: getLocalizedSetting(settings, "building_name", lang) || context.buildingName,
    demoNotice:
      getLocalizedSetting(settings, "building_demo_notice", lang) || context.demoNotice,
    missingLocationMessage:
      getLocalizedSetting(settings, "building_missing_location", lang) ||
      context.missingLocationMessage,
  };

  return resolveBuildingGuideWithContext(query, localizedContext, lang, locationId);
}

export async function searchBuildingLocations(query: string, lang: Language = "en") {
  const context = await getGuideContext();
  const q = query.trim();
  if (!q) return [];

  return context.locations
    .map((loc) => ({ loc, score: scoreMatch(q, loc, lang) }))
    .filter((m) => m.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ loc }) => {
      const { name, floor } = getLocationDisplay(loc, lang);
      return {
        id: loc.id,
        title: loc.room ? `${name} (Room ${loc.room})` : name,
        description: floor,
        href: `/building-directory?q=${encodeURIComponent(name)}`,
        floor,
      };
    });
}
