import { db } from "@/lib/db";
import { pickLang, pickLocalizedText, type Language } from "@/lib/i18n/translations";
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

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchableTerms(location: BuildingLocationData, lang: Language): string[] {
  const { name } = getLocationDisplay(location, lang);
  const terms = [
    name,
    location.nameEn,
    location.nameFil ?? "",
    location.nameBis ?? "",
    location.room ?? "",
    location.category ?? "",
    ...(location.aliases ?? []),
  ];
  return terms.map(normalize).filter(Boolean);
}

function scoreMatch(query: string, location: BuildingLocationData, lang: Language): number {
  const q = normalize(query);
  if (!q) return 0;

  const { name } = getLocationDisplay(location, lang);
  const normalizedName = normalize(name);
  const roomLabel = location.room ? `room ${location.room}` : "";

  if (normalizedName === q) return 100;
  if (roomLabel === q || `room ${location.room}` === q) return 95;
  if (normalizedName.includes(q)) return 80;
  if (q.includes(normalizedName) && normalizedName.length > 3) return 75;

  for (const alias of location.aliases ?? []) {
    const a = normalize(alias);
    if (a === q) return 90;
    if (a.includes(q) || q.includes(a)) return 70;
  }

  if (location.room && (q.includes(location.room) || q === location.room)) return 85;

  const tokens = q.split(" ").filter((t) => t.length > 2);
  let tokenScore = 0;
  for (const token of tokens) {
    if (normalizedName.includes(token)) tokenScore += 20;
    if (roomLabel.includes(token)) tokenScore += 15;
    if ((location.aliases ?? []).some((a) => normalize(a).includes(token))) tokenScore += 15;
    if (location.category && normalize(location.category).includes(token)) tokenScore += 10;
  }

  return tokenScore;
}

function localizeLocation(location: BuildingLocationData, lang: Language) {
  return getLocationDisplay(location, lang);
}

function isRestroomQuery(query: string): boolean {
  const q = normalize(query);
  return /restroom|comfort room|\bcr\b|toilet|washroom|bathroom|nearest restroom|kasilyas|banyo|comfortroom/.test(q);
}

function isEmergencyQuery(query: string): boolean {
  const q = normalize(query);
  return /emergency exit|evacuation|fire exit|emergency door/.test(q);
}

function buildFoundResponse(
  location: BuildingLocationData,
  context: GuideContext,
  query: string,
  lang: Language
): GuideResponse {
  const { name, floor, directions } = localizeLocation(location, lang);
  const buildingName = pickLocalizedText(
    lang,
    context.buildingName,
    context.locations[0]?.buildingNameFil,
    context.locations[0]?.buildingNameBis
  );

  const locatedIn = location.room
    ? pickLang(
        lang,
        `Room ${location.room} on the ${floor}`,
        `Silid ${location.room} sa ${floor}`,
        `${pickLang(lang, "Room", "Room", "Kwarto")} ${location.room} sa ${floor}`
      )
    : floor;

  let message = pickLang(
    lang,
    `The ${name} is located in **${locatedIn}**.`,
    `Ang ${name} ay matatagpuan sa **${locatedIn}**.`,
    `Ang ${name} naa sa **${locatedIn}**.`
  );
  if (context.demoNotice) {
    message = `${context.demoNotice}\n\n${message}`;
  }

  return {
    type: "found",
    isDemoMode: false,
    buildingName,
    query,
    message,
    location: {
      id: location.id,
      name,
      room: location.room,
      floor,
      nearbyLandmarks: location.nearbyLandmarks,
    },
    directions,
  };
}

function findSimilar(locations: BuildingLocationData[], query: string, lang: Language): string[] {
  const scored = locations
    .map((loc) => ({ loc, score: scoreMatch(query, loc, lang) }))
    .filter((s) => s.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return scored.map(({ loc }) => {
    const { name, floor } = localizeLocation(loc, lang);
    return loc.room ? `${name} (${loc.room}, ${floor})` : `${name} (${floor})`;
  });
}

export function askBuildingGuide(
  query: string,
  context: GuideContext,
  lang: Language = "en"
): GuideResponse {
  const trimmed = query.trim();
  const buildingName = context.buildingName;
  const demoNotice = context.demoNotice ?? "";
  const missingMessage = context.missingLocationMessage ?? "";

  if (!trimmed) {
    const helpText = pickLang(
      lang,
      'Ask me about any room or office — for example: "Where is the Treasurer\'s Office?" or "Where is Room 108?"',
      'Tanungin kung nasaan ang silid o opisina — halimbawa: "Nasaan ang Treasurer\'s Office?" o "Nasaan ang Room 108?"',
      'Pangutana asa ang kwarto o opisina — pananglitan: "Asa ang Treasurer\'s Office?" o "Asa ang Room 108?"'
    );
    return {
      type: "demo_notice",
      isDemoMode: false,
      buildingName,
      query: trimmed,
      message: demoNotice ? `${demoNotice}\n\n${helpText}` : helpText,
    };
  }

  if (isEmergencyQuery(trimmed)) {
    const emergency = context.locations.find(
      (l) => l.category === "emergency" || normalize(l.nameEn).includes("emergency exit")
    );
    if (emergency) {
      const response = buildFoundResponse(emergency, context, trimmed, lang);
      return {
        ...response,
        type: "emergency",
        message:
          (demoNotice ? `${demoNotice}\n\n` : "") +
          pickLang(
            lang,
            "For your safety, please follow official emergency procedures and building announcements.\n\n",
            "Para sa iyong kaligtasan, sundin ang opisyal na emergency procedures at mga anunsyo sa gusali.\n\n",
            "Para sa imong kaluwasan, sunda ang opisyal nga emergency procedures ug mga anunsyo sa building.\n\n"
          ) +
          response.message,
      };
    }
  }

  if (isRestroomQuery(trimmed)) {
    const restrooms = context.locations.filter((l) => l.category === "restroom");
    const floorMatch = trimmed.match(/floor\s*(\d)|(\d)(?:st|nd|rd)\s*floor/i);
    const targetFloor = floorMatch ? Number(floorMatch[1] ?? floorMatch[2]) : null;

    const relevant = targetFloor
      ? restrooms.filter((r) => r.floor === targetFloor)
      : restrooms;

    const lines = relevant.map((r) => {
      const { name, floor } = localizeLocation(r, lang);
      const landmark = r.nearbyLandmarks[0];
      if (landmark) {
        return pickLang(
          lang,
          `**${floor}:** ${name} — near ${landmark}.`,
          `**${floor}:** ${name} — malapit sa ${landmark}.`,
          `**${floor}:** ${name} — duol sa ${landmark}.`
        );
      }
      return `**${floor}:** ${name}.`;
    });

    return {
      type: "restroom",
      isDemoMode: false,
      buildingName,
      query: trimmed,
      message:
        (demoNotice ? `${demoNotice}\n\n` : "") +
        pickLang(
          lang,
          "Here are the restrooms in the building:\n\n",
          "Narito ang mga restroom sa gusali:\n\n",
          "Ania ang mga CR sa building:\n\n"
        ) +
        lines.join("\n"),
      suggestions: relevant.map((r) => localizeLocation(r, lang).name),
    };
  }

  const matches = context.locations
    .map((loc) => ({ loc, score: scoreMatch(trimmed, loc, lang) }))
    .filter((m) => m.score >= 40)
    .sort((a, b) => b.score - a.score);

  if (matches.length === 1) {
    return buildFoundResponse(matches[0].loc, context, trimmed, lang);
  }

  if (matches.length > 1) {
    const topScore = matches[0].score;
    const closeMatches = matches.filter((m) => m.score >= topScore - 10);

    if (closeMatches.length === 1) {
      return buildFoundResponse(closeMatches[0].loc, context, trimmed, lang);
    }

    return {
      type: "multiple",
      isDemoMode: false,
      buildingName,
      query: trimmed,
      message:
        (demoNotice ? `${demoNotice}\n\n` : "") +
        pickLang(
          lang,
          "I found multiple locations that match your search. Which one do you mean?",
          "Nakita ko ang maraming lokasyon na tumutugma sa iyong paghahanap. Alin ang ibig mong sabihin?",
          "Nakita nako ang daghang lokasyon nga match sa imong pagpangita. Asa sa imong gipasabot?"
        ),
      matches: closeMatches.map(({ loc }) => {
        const { name, floor } = localizeLocation(loc, lang);
        return { id: loc.id, name, room: loc.room, floor };
      }),
    };
  }

  const suggestions = findSimilar(context.locations, trimmed, lang);

  const defaultSuggestions = pickLang(
    lang,
    ["Treasurer's Office", "Business Permits Office", "Information Desk"],
    ["Treasurer's Office", "Business Permits Office", "Information Desk"],
    ["Treasurer's Office", "Business Permits Office", "Information Desk"]
  );

  const notFoundSuffix = pickLang(
    lang,
    "Please visit the Information Desk for further assistance, or try searching for a room number or office name.",
    "Mangyaring bisitahin ang Information Desk para sa karagdagang tulong, o subukang maghanap ng room number o pangalan ng opisina.",
    "Palihog bisitaha ang Information Desk para sa dugang tabang, o sulayi pangitaa ang room number o ngalan sa opisina."
  );

  const message = missingMessage || notFoundSuffix;

  return {
    type: "not_found",
    isDemoMode: false,
    buildingName,
    query: trimmed,
    message,
    suggestions: suggestions.length > 0 ? suggestions : defaultSuggestions,
  };
}

export function resolveBuildingGuideWithContext(
  query: string,
  context: GuideContext,
  lang: Language = "en",
  locationId?: string
): GuideResponse {
  if (locationId) {
    const location = context.locations.find((l) => l.id === locationId);
    if (location) {
      return buildFoundResponse(location, context, query, lang);
    }
  }

  return askBuildingGuide(query, context, lang);
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
      const { name, floor } = localizeLocation(loc, lang);
      return {
        id: loc.id,
        title: loc.room ? `${name} (Room ${loc.room})` : name,
        description: floor,
        href: `/building-directory?q=${encodeURIComponent(name)}`,
        floor,
      };
    });
}
