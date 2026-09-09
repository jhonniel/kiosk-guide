import { pickLang, pickLocalizedText, type Language } from "@/lib/i18n/translations";
import { getLocationDisplay } from "./location-display";
import type { BuildingLocationData, GuideContext, GuideResponse } from "./types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\w\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreMatch(query: string, location: BuildingLocationData, lang: Language): number {
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
