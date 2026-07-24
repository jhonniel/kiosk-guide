import type { Language } from "@/lib/i18n/translations";
import type { CamiKnowledgeChunk } from "./types";

type LocalizedFields = {
  titleEn?: string | null;
  titleFil?: string | null;
  titleBis?: string | null;
  nameEn?: string | null;
  nameFil?: string | null;
  nameBis?: string | null;
  questionEn?: string | null;
  questionFil?: string | null;
  questionBis?: string | null;
  descriptionEn?: string | null;
  descriptionFil?: string | null;
  descriptionBis?: string | null;
  answerEn?: string | null;
  answerFil?: string | null;
  answerBis?: string | null;
  contentEn?: string | null;
  contentFil?: string | null;
  contentBis?: string | null;
};

function pickLocalized(
  item: LocalizedFields,
  language: Language,
  keys: Array<"title" | "name" | "question" | "description" | "answer" | "content">
) {
  const prefer = (base: string) => {
    if (language === "fil") {
      return (
        (item as Record<string, string | null | undefined>)[`${base}Fil`] ||
        (item as Record<string, string | null | undefined>)[`${base}En`] ||
        ""
      );
    }
    if (language === "bis") {
      return (
        (item as Record<string, string | null | undefined>)[`${base}Bis`] ||
        (item as Record<string, string | null | undefined>)[`${base}En`] ||
        ""
      );
    }
    return (item as Record<string, string | null | undefined>)[`${base}En`] || "";
  };

  return keys.map((key) => prefer(key)).filter(Boolean);
}

/** Merge EN/FIL/BIS text so ranking works no matter which language the user typed. */
function multilingualBlob(
  item: LocalizedFields,
  keys: Array<"title" | "name" | "question" | "description" | "answer" | "content">
) {
  const parts: string[] = [];
  for (const key of keys) {
    for (const suffix of ["En", "Fil", "Bis"] as const) {
      const value = (item as Record<string, string | null | undefined>)[`${key}${suffix}`];
      if (value?.trim()) parts.push(value.trim());
    }
  }
  return [...new Set(parts)].join(" ");
}

const QUERY_STOPWORDS = new Set([
  "where",
  "what",
  "when",
  "which",
  "who",
  "whom",
  "whose",
  "why",
  "how",
  "can",
  "could",
  "would",
  "should",
  "does",
  "did",
  "are",
  "was",
  "were",
  "the",
  "and",
  "for",
  "from",
  "with",
  "about",
  "into",
  "onto",
  "find",
  "tell",
  "please",
  "help",
  "need",
  "know",
  "ask",
  "open",
  "show",
  "give",
  "list",
  "sino",
  "ano",
  "saan",
  "nasaan",
  "paano",
  "bakit",
  "kailan",
  "kumusta",
  "kinsa",
  "asa",
  "unsa",
  "unsaon",
  "unsayon",
  "ngano",
  "kanus-a",
  "ang",
  "mga",
  "naman",
  "lang",
  "ba",
  "po",
  "opo",
  "nga",
  "kay",
  "ug",
  "og",
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u00f1\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\s']/gi, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !QUERY_STOPWORDS.has(token));
}

export function scoreChunk(query: string, chunk: CamiKnowledgeChunk) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const hay = `${chunk.title} ${chunk.body}`.toLowerCase();
  const title = chunk.title.toLowerCase();
  const tokens = tokenize(q);
  let score = 0;

  if (hay.includes(q)) score += 14;

  for (const token of tokens) {
    if (hay.includes(token)) score += 2;
    if (title.includes(token)) score += 3;
  }

  // Location-of-Camiguin questions should prefer overview/map, not "Where can I…?" FAQs.
  if (isCamiguinLocationQuery(q) && (chunk.id === "system-camiguin" || chunk.type === "travel")) {
    score += 16;
  }

  // Office / directory questions should prefer kiosk directory rows.
  if (
    isOfficeQuery(q) &&
    (chunk.type === "directory" || chunk.type === "building" || chunk.id === "system-office-hours")
  ) {
    score += 12;
  }

  // Soften FAQs that only matched via shared question-word titles when the query is thin.
  if (chunk.type === "faq" && /^(where|what|how|when|who)\b/.test(title) && tokens.length <= 1) {
    score -= 4;
  }

  return Math.max(0, score);
}

function isCamiguinLocationQuery(q: string) {
  return (
    (/where\s+is|nasaan|asa\s+(ang|si)|located|location|mapa|map of/.test(q) &&
      /camiguin|island/.test(q)) ||
    /where\s+is\s+camiguin|nasaan\s+ang\s+camiguin|asa\s+ang\s+camiguin/.test(q)
  );
}

/** “Where is X?” / Nasaan / Asa / Saan — looking up a named place. */
export function isPlaceLookupQuery(query: string) {
  const q = query.toLowerCase().trim();
  return (
    /\b(where\s+is|where\s+can\s+i\s+find|nasaan(?:\s+ang)?|saan(?:\s+ang)?|asa(?:\s+ang)?|location\s+of|located\s+in|nahimutang|makita)\b/.test(
      q
    ) && !isCamiguinLocationQuery(q)
  );
}

/** “Who is X?” / Sino / Kinsa — looking up a person (try Camiguin web search). */
export function isPersonLookupQuery(query: string) {
  const q = query.toLowerCase().trim();
  return (
    /\b(who\s+is|who's|who\s+was|sino(?:\s+(?:si|ang|ba))?|kinsa(?:\s+(?:si|ang|ba))?)\b/.test(q) &&
    !/\b(who\s+are\s+you|sino\s+ka|kinsa\s+ka)\b/.test(q)
  );
}

export function extractPlaceName(query: string): string | null {
  const q = query.trim();
  const patterns = [
    /where\s+can\s+i\s+find\s+(.+?)(?:\?|$)/i,
    /where\s+is\s+(.+?)(?:\?|$)/i,
    /nasaan(?:\s+ang)?\s+(.+?)(?:\?|$)/i,
    /saan(?:\s+ang)?\s+(.+?)(?:\?|$)/i,
    /asa(?:\s+ang)?\s+(.+?)(?:\?|$)/i,
    /location\s+of\s+(.+?)(?:\?|$)/i,
    /nahimutang(?:\s+ba)?(?:\s+ang)?\s+(.+?)(?:\?|$)/i,
  ];
  for (const pattern of patterns) {
    const match = q.match(pattern);
    if (!match?.[1]) continue;
    const place = match[1]
      .replace(/\b(located|please|po|ba|the|a|an|in|sa|ng|ang|nga|ba)\b/gi, " ")
      .replace(/[?.!,]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
    if (place.length >= 3) return place;
  }
  return null;
}

export function textMentionsPlace(place: string, text: string) {
  const p = place.toLowerCase().trim();
  if (p.length < 3) return false;
  return text.toLowerCase().includes(p);
}

export function contextMentionsPlace(
  place: string,
  ranked: Array<{ title: string; body: string }>,
  webHits: Array<{ title: string; snippet: string }> = []
) {
  if (ranked.some((chunk) => textMentionsPlace(place, `${chunk.title} ${chunk.body}`))) {
    return true;
  }
  return webHits.some((hit) => textMentionsPlace(place, `${hit.title} ${hit.snippet}`));
}

export function unknownPlaceReply(language: Language, place: string) {
  const label = place.trim();
  return pickLang(
    language,
    `I don’t have information that “${label}” is in Camiguin. Ask about places on the island—like White Island, Mantigue, Katibawasan Falls, Ardent Hot Springs, or a municipality (Mambajao, Mahinog, Catarman, Sagay, Guinsiliban).`,
    `Wala akong impormasyon na ang “${label}” ay nasa Camiguin. Magtanong tungkol sa mga lugar sa isla—tulad ng White Island, Mantigue, Katibawasan Falls, Ardent Hot Springs, o munisipalidad (Mambajao, Mahinog, Catarman, Sagay, Guinsiliban).`,
    `Wala koy impormasyon nga ang “${label}” naa sa Camiguin. Pangutana bahin sa mga lugar sa isla—sama sa White Island, Mantigue, Katibawasan Falls, Ardent Hot Springs, o lungsod (Mambajao, Mahinog, Catarman, Sagay, Guinsiliban).`
  );
}

/** Minimum score before we treat kiosk data as a solid answer (vs web). */
export const STRONG_LOCAL_SCORE = 10;

export function rankChunks(query: string, chunks: CamiKnowledgeChunk[], limit = 8) {
  return chunks
    .map((chunk) => ({ ...chunk, score: scoreChunk(query, chunk) }))
    .filter((chunk) => (chunk.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);
}

export function hasStrongLocalMatch(ranked: Array<CamiKnowledgeChunk & { score?: number }>) {
  return (ranked[0]?.score ?? 0) >= STRONG_LOCAL_SCORE;
}

export type CamiCorpusInput = {
  faqs?: Array<
    LocalizedFields & {
      id: string;
      category?: string | null;
    }
  >;
  tourism?: Array<
    LocalizedFields & {
      id: string;
      location?: string | null;
      category?: string | null;
    }
  >;
  events?: Array<
    LocalizedFields & {
      id: string;
      location?: string | null;
      startDate?: Date | string;
      endDate?: Date | string | null;
    }
  >;
  emergency?: Array<
    LocalizedFields & {
      id: string;
      phoneNumber?: string | null;
      category?: string | null;
    }
  >;
  services?: Array<
    LocalizedFields & {
      id: string;
      slug: string;
      officeLocation?: string | null;
      requirementsEn?: string | null;
      requirementsFil?: string | null;
      requirementsBis?: string | null;
    }
  >;
  directories?: Array<
    LocalizedFields & {
      id: string;
      type?: string | null;
      department?: string | null;
      building?: string | null;
      floor?: string | null;
      room?: string | null;
      contactNumber?: string | null;
      email?: string | null;
      headName?: string | null;
      headOfOffice?: string | null;
      officeHours?: string | null;
    }
  >;
  downloads?: Array<
    LocalizedFields & {
      id: string;
      category?: string | null;
      fileName?: string | null;
    }
  >;
  announcements?: Array<
    LocalizedFields & {
      id: string;
      category?: string | null;
    }
  >;
  /** Global Capitol / kiosk office hours from settings */
  officeHoursText?: string | null;
};

export function buildCamiCorpus(data: CamiCorpusInput, language: Language): CamiKnowledgeChunk[] {
  const chunks: CamiKnowledgeChunk[] = [];

  for (const faq of data.faqs ?? []) {
    const [question, answer] = pickLocalized(faq, language, ["question", "answer"]);
    const multi = multilingualBlob(faq, ["question", "answer"]);
    chunks.push({
      id: `faq-${faq.id}`,
      type: "faq",
      title: question,
      body: `${answer}${faq.category ? ` Category: ${faq.category}.` : ""} ${multi}`.trim(),
      href: "/faq",
    });
  }

  for (const spot of data.tourism ?? []) {
    const [title, description] = pickLocalized(spot, language, ["title", "description"]);
    const multi = multilingualBlob(spot, ["title", "description"]);
    chunks.push({
      id: `tourism-${spot.id}`,
      type: "tourism",
      title,
      body: `${description}${spot.location ? ` Location: ${spot.location}.` : ""}${
        spot.category ? ` Category: ${spot.category}.` : ""
      } ${multi}`.trim(),
      href: "/tourism",
    });
  }

  for (const event of data.events ?? []) {
    const [title, description] = pickLocalized(event, language, ["title", "description"]);
    const multi = multilingualBlob(event, ["title", "description"]);
    const start = event.startDate ? new Date(event.startDate).toLocaleString() : "";
    const end = event.endDate ? new Date(event.endDate).toLocaleString() : "";
    chunks.push({
      id: `event-${event.id}`,
      type: "event",
      title,
      body: `${description}${event.location ? ` Location: ${event.location}.` : ""} When: ${start}${
        end ? ` – ${end}` : ""
      }. ${multi}`.trim(),
      href: "/events",
    });
  }

  for (const contact of data.emergency ?? []) {
    const [name, description] = pickLocalized(contact, language, ["name", "description"]);
    const multi = multilingualBlob(contact, ["name", "description"]);
    chunks.push({
      id: `emergency-${contact.id}`,
      type: "emergency",
      title: name,
      body: `${description || "Emergency contact."} Phone: ${contact.phoneNumber ?? "N/A"}.${
        contact.category ? ` Area: ${contact.category}.` : ""
      } ${multi}`.trim(),
      href: "/emergency",
    });
  }

  for (const service of data.services ?? []) {
    const [title, description] = pickLocalized(service, language, ["title", "description"]);
    const multi = multilingualBlob(service, ["title", "description"]);
    const reqs =
      language === "fil"
        ? service.requirementsFil || service.requirementsEn || ""
        : language === "bis"
          ? service.requirementsBis || service.requirementsEn || ""
          : service.requirementsEn || "";
    chunks.push({
      id: `service-${service.id}`,
      type: "service",
      title,
      body: `${description} ${reqs}${service.officeLocation ? ` Office: ${service.officeLocation}.` : ""} ${multi}`.trim(),
      href: `/services/${service.slug}`,
    });
  }

  for (const dir of data.directories ?? []) {
    const [name, description] = pickLocalized(dir, language, ["name", "description"]);
    const multi = multilingualBlob(dir, ["name", "description"]);
    const head = dir.headName || dir.headOfOffice || "";
    const locationParts = [dir.building, dir.floor, dir.room ? `Room ${dir.room}` : ""]
      .filter(Boolean)
      .join(", ");
    chunks.push({
      id: `directory-${dir.id}`,
      type: dir.type === "building" ? "building" : "directory",
      title: name,
      body: [
        description || "",
        dir.department ? `Department: ${dir.department}.` : "",
        locationParts ? `Location: ${locationParts}.` : "",
        head ? `Head / Official: ${head}.` : "",
        dir.contactNumber ? `Contact: ${dir.contactNumber}.` : "",
        dir.email ? `Email: ${dir.email}.` : "",
        dir.officeHours ? `Office hours: ${dir.officeHours}.` : "",
        multi,
      ]
        .filter(Boolean)
        .join(" ")
        .trim(),
      href: dir.type === "building" ? "/building-directory" : "/government-directory",
    });
  }

  if (data.officeHoursText?.trim()) {
    chunks.push({
      id: "system-office-hours",
      type: "kiosk",
      title: pickLang(language, "Capitol office hours", "Oras ng opisina sa Capitol", "Oras sa opisina sa Capitol"),
      body: pickLang(
        language,
        `Provincial Capitol office hours: ${data.officeHoursText.trim()}. For specific offices, see the Building Directory or Government Directory.`,
        `Oras ng Provincial Capitol: ${data.officeHoursText.trim()}. Para sa partikular na opisina, tingnan ang Building Directory o Government Directory.`,
        `Oras sa Provincial Capitol: ${data.officeHoursText.trim()}. Para sa piho nga opisina, tan-awa ang Building Directory o Government Directory.`
      ),
      href: "/office-hours",
    });
  }

  for (const download of data.downloads ?? []) {
    const [title, description] = pickLocalized(download, language, ["title", "description"]);
    const multi = multilingualBlob(download, ["title", "description"]);
    chunks.push({
      id: `download-${download.id}`,
      type: "download",
      title,
      body: `${description || download.fileName || ""}${download.category ? ` Category: ${download.category}.` : ""} ${multi}`.trim(),
      href: "/download-center",
    });
  }

  for (const item of data.announcements ?? []) {
    const [title, content] = pickLocalized(item, language, ["title", "content"]);
    const multi = multilingualBlob(item, ["title", "content"]);
    chunks.push({
      id: `news-${item.id}`,
      type: "news",
      title,
      body: `${content}${item.category ? ` Category: ${item.category}.` : ""} ${multi}`.trim(),
      href: "/news",
    });
  }

  chunks.push({
    id: "system-cami",
    type: "kiosk",
    title: "Cami assistant",
    body: "Cami is the Camiguin kiosk assistant. Cami answers only about Camiguin Province and information available in this kiosk system (services, tourism, events, emergency contacts, downloads, directories, FAQs, news).",
    href: "/faq",
  });

  chunks.push({
    id: "system-camiguin",
    type: "travel",
    title: "Camiguin overview",
    body: "Camiguin is an island province in Northern Mindanao, Philippines, with five municipalities: Mambajao (capital), Mahinog, Guinsiliban, Sagay, and Catarman. Visitors often arrive via Benoni Port in Mahinog. Signature attractions include White Island, Katibawasan Falls, Sunken Cemetery, Mantigue Island, Ardent Hot Springs, and Mt. Hibok-Hibok. Signature events include Lanzones Festival, Panaad, Sinulog de Camiguin, and San Juan Hibok-Hibokan.",
    href: "/map",
  });

  chunks.push({
    id: "system-leadership",
    type: "directory",
    title: "Current Camiguin provincial leadership",
    body: "The current Provincial Governor of Camiguin is Hon. Xavier Jesus “XJ” D. Romualdo (also known as Xavier Jesus Romualdo). The Governor’s Office is at the Capitol Building (2nd Floor, Room 201), contact (088) 387-1001 / email governor@camiguin.gov.ph. For provincial department heads and contacts, open the Government Directory module.",
    href: "/government-directory",
  });

  return chunks;
}

export function buildLocalReply(
  query: string,
  ranked: Array<CamiKnowledgeChunk & { score?: number }>,
  language: Language,
  webHits: Array<{ title: string; snippet: string; url: string }> = []
): string {
  const direct = buildDirectFactAnswer(query, ranked, webHits, language);
  if (direct) return direct;

  const place = extractPlaceName(query);
  if (place && isPlaceLookupQuery(query) && !contextMentionsPlace(place, ranked, webHits)) {
    return unknownPlaceReply(language, place);
  }

  const top = ranked[0];
  const webTop = webHits[0];
  const strongLocal = hasStrongLocalMatch(ranked);

  if (!top && !webTop) {
    return outOfScopeReply(language);
  }

  // Prefer web when kiosk only has a weak/generic match (e.g. just the word "Camiguin").
  if (webTop && !strongLocal) {
    const body =
      webTop.snippet.length > 280 ? `${webTop.snippet.slice(0, 277)}...` : webTop.snippet;
    return body;
  }

  if (!strongLocal && !webTop) {
    return outOfScopeReply(language);
  }

  if (top) {
    // Answer with the content, not by repeating an FAQ question as the lead-in.
    const body = top.body.length > 280 ? `${top.body.slice(0, 277)}...` : top.body;
    if (top.type === "faq") return body;
    return body;
  }

  const body =
    webTop!.snippet.length > 280 ? `${webTop!.snippet.slice(0, 277)}...` : webTop!.snippet;
  return body;
}

/** Default highlight spots when DB tourism rows are thin. */
const DEFAULT_TOURIST_SPOTS = [
  "White Island",
  "Katibawasan Falls",
  "Sunken Cemetery",
  "Mantigue Island",
  "Ardent Hot Springs",
  "Old Church Ruins",
  "Mt. Hibok-Hibok",
  "Sto. Niño Cold Springs",
  "Tuasan Falls",
  "Giant Clam Sanctuary",
];

export function isTouristSpotsQuery(query: string) {
  const q = query.toLowerCase();
  return (
    /\b(tourist\s*spots?|tourism|turismo|attractions?|atraksiyon|atraksyon|places?\s+to\s+(visit|see|go)|what\s+to\s+(see|do|visit)|things\s+to\s+do|must[- ]?see|destinations?|destinasyon|lugar\s+na\s+pupuntahan|mga\s+lugar|unsa\s+ang\s+makita|ano\s+ang\s+makikita|recommend|irekomenda|rekomenda|sugyot|i\-?suggest)\b/.test(
      q
    ) ||
    /\b(visit|bisita|adto|pumunta|mag\-?tour)\b/.test(q) &&
      /\b(camiguin|island|isla|spot|lugar|fall|falls|beach|spring)\b/.test(q)
  );
}

export function suggestTouristSpotsReply(
  language: Language,
  ranked: CamiKnowledgeChunk[] = []
): string {
  const fromDb = ranked
    .filter((chunk) => chunk.type === "tourism")
    .map((chunk) => chunk.title.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const spots: string[] = [];
  for (const name of [...fromDb, ...DEFAULT_TOURIST_SPOTS]) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    spots.push(name);
    if (spots.length >= 8) break;
  }

  const list = spots.map((name) => `• ${name}`).join("\n");

  return pickLang(
    language,
    `Here are popular tourist spots in Camiguin:\n${list}\n\nOpen Tourism or the Map module for details and directions.`,
    `Narito ang mga sikat na tourist spots sa Camiguin:\n${list}\n\nBuksan ang Tourism o Map module para sa detalye at direksyon.`,
    `Ania ang mga sikat nga tourist spots sa Camiguin:\n${list}\n\nAblihi ang Tourism o Map module para sa detalye ug direksyon.`
  );
}

export function isOfficeQuery(query: string) {
  const q = query.toLowerCase();
  return (
    /\b(office|offices|opisina|departamento|department|capitol|directory|building\s+directory|government\s+directory|room|floor|gusali|where\s+is\s+the\s+\w+\s+office|asa\s+ang\s+\w+\s+opisina|nasaan\s+ang\s+\w+\s+opisina|office\s+hours|oras\s+ng\s+opisina|oras\s+sa\s+opisina|contact\s+number|telepono|head\s+of\s+office|treasurer|assessor|accountant|administrator|governor.?s?\s+office|mayor.?s?\s+office|permit\s+office|cedula)\b/.test(
      q
    ) || /\b(opisina|office)\b/.test(q)
  );
}

function formatOfficeChunk(chunk: CamiKnowledgeChunk, language: Language): string {
  const body = chunk.body.replace(/\s+/g, " ").trim();
  return pickLang(
    language,
    `${chunk.title}: ${body}`,
    `${chunk.title}: ${body}`,
    `${chunk.title}: ${body}`
  );
}

/** Answer office questions using kiosk directory / office-hours data only. */
export function answerOfficeFromKiosk(
  query: string,
  corpus: CamiKnowledgeChunk[],
  language: Language
): { reply: string; citations: CamiKnowledgeChunk[] } | null {
  const q = query.toLowerCase();
  const officeChunks = corpus.filter(
    (chunk) =>
      chunk.type === "directory" ||
      chunk.type === "building" ||
      chunk.id === "system-office-hours" ||
      chunk.id === "system-leadership"
  );

  if (!officeChunks.length) return null;

  const rankedOffices = rankChunks(query, officeChunks, 8).filter((c) => (c.score ?? 0) > 0);

  // General office hours
  if (/\b(office\s+hours|oras\s+(ng|sa)\s+opisina|open(?:ing)?\s+hours|anong\s+oras|unsa\s+ang\s+oras)\b/.test(q)) {
    const hoursChunk =
      officeChunks.find((c) => c.id === "system-office-hours") ||
      rankedOffices.find((c) => /office hours|oras/i.test(`${c.title} ${c.body}`));
    if (hoursChunk) {
      return { reply: formatOfficeChunk(hoursChunk, language), citations: [hoursChunk] };
    }
    return {
      reply: pickLang(
        language,
        "Capitol offices are generally open Monday to Friday, 8:00 AM – 5:00 PM. Check Building Directory or Office Hours on this kiosk for details.",
        "Ang mga opisina sa Capitol ay bukas karaniwang Lunes hanggang Biyernes, 8:00 AM – 5:00 PM. Tingnan ang Building Directory o Office Hours sa kiosk para sa detalye.",
        "Ang mga opisina sa Capitol abli kasagaran Lunes hangtod Biyernes, 8:00 AM – 5:00 PM. Tan-awa ang Building Directory o Office Hours sa kiosk para sa detalye."
      ),
      citations: [],
    };
  }

  // List offices
  if (
    /\b(list|mga\s+opisina|unsa\s+nga\s+opisina|ano\s+ang\s+mga\s+opisina|what\s+offices|which\s+offices|offices\s+in\s+(the\s+)?capitol)\b/.test(
      q
    ) ||
    (/^\s*(offices|opisina|mga\s+opisina)\s*\??\s*$/.test(q) && !rankedOffices[0])
  ) {
    const listSource = officeChunks
      .filter((c) => c.type === "directory" || c.type === "building")
      .slice(0, 10);
    if (!listSource.length) return null;
    const list = listSource.map((c) => `• ${c.title}`).join("\n");
    return {
      reply: pickLang(
        language,
        `Offices in this kiosk directory:\n${list}\n\nAsk about a specific office for location and contact details, or open Building / Government Directory.`,
        `Mga opisina sa directory ng kiosk:\n${list}\n\nMagtanong tungkol sa partikular na opisina para sa lokasyon at contact, o buksan ang Building / Government Directory.`,
        `Mga opisina sa directory sa kiosk:\n${list}\n\nPangutana bahin sa piho nga opisina para sa lokasyon ug contact, o ablihi ang Building / Government Directory.`
      ),
      citations: listSource.slice(0, 5),
    };
  }

  // Specific office match from kiosk data
  if (rankedOffices.length > 0) {
    const top = rankedOffices[0]!;
    // Prefer real directory rows over the generic hours/leadership chunk when possible
    const best =
      rankedOffices.find((c) => c.type === "directory" || c.type === "building") || top;

    if ((best.score ?? 0) >= 4 || /office|opisina|room|floor|department|departamento/i.test(q)) {
      const extras = rankedOffices
        .filter((c) => c.id !== best.id && (c.type === "directory" || c.type === "building"))
        .slice(0, 2);
      let reply = formatOfficeChunk(best, language);
      if (extras.length && /\b(list|mga|offices)\b/.test(q)) {
        reply +=
          "\n\n" +
          pickLang(language, "Related:", "Kaugnay:", "May kalabutan:") +
          "\n" +
          extras.map((c) => `• ${c.title}`).join("\n");
      }
      reply +=
        "\n\n" +
        pickLang(
          language,
          "Source: kiosk Building / Government Directory.",
          "Batay sa Building / Government Directory ng kiosk.",
          "Gikan sa Building / Government Directory sa kiosk."
        );
      return { reply, citations: [best, ...extras] };
    }
  }

  return null;
}

function buildDirectFactAnswer(
  query: string,
  ranked: CamiKnowledgeChunk[],
  webHits: Array<{ title: string; snippet: string; url: string }>,
  language: Language
): string | null {
  const q = query.toLowerCase();

  if (isTouristSpotsQuery(q)) {
    return suggestTouristSpotsReply(language, ranked);
  }

  if (isOfficeQuery(q)) {
    const officeAnswer = answerOfficeFromKiosk(query, ranked, language);
    if (officeAnswer) return officeAnswer.reply;
  }

  if (isCamiguinLocationQuery(q)) {
    return pickLang(
      language,
      "Camiguin is an island province in Northern Mindanao, Philippines, in the Bohol Sea about 10 km off the northern coast of Misamis Oriental. Its capital is Mambajao, and it has five municipalities: Mambajao, Mahinog, Guinsiliban, Sagay, and Catarman.",
      "Ang Camiguin ay isang isla-lalawigan sa Northern Mindanao, Pilipinas, sa Bohol Sea mga 10 km mula sa hilagang baybayin ng Misamis Oriental. Ang kapital ay Mambajao, at may limang munisipalidad: Mambajao, Mahinog, Guinsiliban, Sagay, at Catarman.",
      "Ang Camiguin usa ka isla-lalawigan sa Northern Mindanao, Pilipinas, sa Bohol Sea mga 10 km gikan sa amihanang baybayon sa Misamis Oriental. Ang kapital kay Mambajao, ug naa’y lima ka lungsod: Mambajao, Mahinog, Guinsiliban, Sagay, ug Catarman."
    );
  }

  if (/who\s+is|sino\s+ang|kinsa\s+ang/.test(q) && /governor|gobernador/.test(q)) {
    const local = ranked.find(
      (chunk) =>
        /romualdo|governor of camiguin|provincial governor|current camiguin provincial leadership/i.test(
          `${chunk.title} ${chunk.body}`
        )
    );
    const web = webHits.find((hit) =>
      /romualdo|governor of camiguin/i.test(`${hit.title} ${hit.snippet}`)
    );

    if (local || web) {
      return pickLang(
        language,
        "Hon. Xavier Jesus “XJ” D. Romualdo is the current Provincial Governor of Camiguin.",
        "Si Hon. Xavier Jesus “XJ” D. Romualdo ang kasalukuyang Provincial Governor ng Camiguin.",
        "Si Hon. Xavier Jesus “XJ” D. Romualdo ang kasamtangang Provincial Governor sa Camiguin."
      );
    }
  }

  return null;
}

function pickLang(language: Language, en: string, fil: string, bis: string) {
  if (language === "fil") return fil;
  if (language === "bis") return bis;
  return en;
}

const CAMIGUIN_PLACE_CUES = [
  "camiguin",
  "mambajao",
  "mahinog",
  "catarman",
  "sagay",
  "guinsiliban",
  "lanzones",
  "hibok",
  "white island",
  "mantigue",
  "katibawasan",
  "sunken",
  "benoni",
  "panaad",
  "ardent",
  "yumbing",
  "bonbon",
  "tangub",
  "old volcano",
  "island born of fire",
];

const KIOSK_TOPIC_CUES = [
  "capitol",
  "cedula",
  "permit",
  "tourism",
  "turismo",
  "festival",
  "piyesta",
  "pista",
  "emergency",
  "emerhensya",
  "hotline",
  "kiosk",
  "cami",
  "barangay",
  "provincial",
  "office",
  "opisina",
  "download",
  "map",
  "mapa",
  "fall",
  "falls",
  "spring",
  "dive",
  "beach",
  "port",
  "pantalan",
  "sinulog",
  "governor",
  "gobernador",
  "gubernador",
  "vice governor",
  "mayor",
  "alkalde",
  "romualdo",
  "yggy",
  "yñigo",
  "ynigo",
  "service",
  "serbisyo",
  "faq",
  "form",
  "announcement",
  "news",
  "balita",
  "event",
  "travel",
  "how to get",
  "paano pumunta",
  "paano makapunta",
  "unsaon pag-adto",
  "unsaon pagadto",
  "panahon",
  "weather",
  "climate",
  "ulan",
  "init",
  "tag-ulan",
  "tag-init",
  "nagaulan",
  "mainit",
  "lamig",
  "tuloy",
  "direksyon",
  "direksiyon",
  "lokasyon",
  "lugar",
  "destinasyon",
  "atraksiyon",
  "atraksyon",
  "attraction",
  "hotline",
  "kontakt",
  "kontak",
  "telepono",
  "numero",
  "oras",
  "hours",
  "schedule",
  "iskedyul",
  "pagkaon",
  "food",
  "restaurant",
  "hotel",
  "accommodation",
  "stay",
  "visit",
  "bisita",
  "adto",
  "pumunta",
  "tour",
  "snorkel",
  "diving",
  "volcano",
  "bulkan",
  "waterfall",
  "busay",
  "talon",
  "municipality",
  "munisipyo",
  "lungsod",
  "tourist spot",
  "tourist spots",
  "tourist",
  "must see",
  "must-see",
  "things to do",
  "what to do",
  "what can i",
  "ano ang makikita",
  "unsa ang makita",
  "directory",
  "building",
  "gusali",
  "floor",
  "room",
  "feedback",
  "charter",
  "recommend",
  "irekomenda",
  "rekomenda",
  "sugyot",
];

const OUT_OF_ISLAND_PLACES = [
  "matina",
  "davao city",
  "davao",
  "manila",
  "makati",
  "quezon city",
  "taguig",
  "pasay",
  "cebu city",
  "boracay",
  "palawan",
  "el nido",
  "baguio",
  "iloilo",
  "bacolod",
  "zamboanga",
  "general santos",
  "gensan",
  "tagum",
  "butuan",
  "surigao city",
  "siargao",
  "cagayan de oro",
  "cdo",
  "bohol",
  "panglao",
  "dumaguete",
  "negros",
  "leyte",
  "samar",
  "luzon",
  "visayas",
  "singapore",
  "japan",
  "korea",
  "hong kong",
  "usa",
  "america",
  "europe",
  "china",
  "taiwan",
  "australia",
];

/** Clearly general / off-kiosk topics (refuse unless tied to Camiguin). */
const UNRELATED_TOPIC_CUES = [
  "stock market",
  "write a novel",
  "python code",
  "javascript",
  "homework",
  "nba",
  "crypto",
  "bitcoin",
  "recipe",
  "dating advice",
  "movie review",
  "football score",
  "who won",
  "chatgpt",
  "write me a poem",
  "write a poem",
  "translate this paragraph",
  "tell me a joke",
  "kwento ng biro",
  "sulti og joke",
  "quantum",
  "physics",
  "calculus",
  "algebra",
  "elon musk",
  "taylor swift",
  "president of the",
  "pangulo ng amerika",
  "who is the president of",
  "capital of france",
  "capital of japan",
  "how to code",
  "programming",
  "make me rich",
  "lottery",
  "horoscope",
  "astrology",
  "love advice",
  "relationship advice",
];

function hasAnyCue(q: string, cues: string[]) {
  return cues.some((cue) => q.includes(cue));
}

function mentionsOutOfIslandPlace(q: string) {
  return OUT_OF_ISLAND_PLACES.some((place) => {
    if (place.length <= 4) {
      return new RegExp(`\\b${place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(q);
    }
    return q.includes(place);
  });
}

export function isGreetingOrMetaQuery(query: string) {
  const q = query.toLowerCase().trim();
  return (
    /^(hi|hello|hey|kumusta|kamusta|maayong|good (morning|afternoon|evening)|help|tulong|thanks|salamat|hola)\b/.test(
      q
    ) ||
    /\b(what can you|what do you|who are you|unsa imong|ano ang kaya mo|sino ka|kinsa ka|unsa imo|ano ka)\b/.test(
      q
    )
  );
}

export function outOfScopeReply(language: Language) {
  return pickLang(
    language,
    "All I know is within Camiguin and this kiosk’s information only. Please ask about tourism, services, events, emergency contacts, maps, downloads, offices, or other Camiguin kiosk topics.",
    "Ang alam ko lang ay nasa loob ng Camiguin at ng impormasyon sa kiosk na ito. Magtanong tungkol sa turismo, serbisyo, events, emergency contacts, mapa, downloads, opisina, o iba pang paksang Camiguin/kiosk.",
    "Ang akong nahibaloan anaa ra sulod sa Camiguin ug sa impormasyon niining kiosk. Pangutana bahin sa turismo, serbisyo, events, emergency contacts, mapa, downloads, opisina, o ubang topiko sa Camiguin/kiosk."
  );
}

/**
 * Only Camiguin Province + this kiosk’s information.
 * Unrelated general questions are refused.
 */
export function isInScopeQuery(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return false;

  const blocked = [
    "write malware",
    "hack",
    "bitcoin wallet",
    "ignore previous",
    "jailbreak",
  ];
  if (blocked.some((item) => q.includes(item))) return false;

  // Greetings / “who are you” stay allowed.
  if (isGreetingOrMetaQuery(q)) {
    return true;
  }

  const hasCamiguinPlace = hasAnyCue(q, CAMIGUIN_PLACE_CUES);
  const hasKioskTopic = hasAnyCue(q, KIOSK_TOPIC_CUES);
  const linkedToCamiguin =
    hasCamiguinPlace ||
    /\b(to|from|via|through)\s+camiguin\b/.test(q) ||
    /\bcamiguin\b/.test(q);

  // Other cities/countries without a Camiguin travel link → refuse.
  if (mentionsOutOfIslandPlace(q) && !linkedToCamiguin) {
    return false;
  }

  // Explicitly unrelated general topics → refuse.
  if (hasAnyCue(q, UNRELATED_TOPIC_CUES) && !linkedToCamiguin) {
    return false;
  }

  // “Where is X?” for an unknown/non-island place → refuse.
  if (isPlaceLookupQuery(q) && !hasCamiguinPlace && !knownIslandPlaceLookup(q)) {
    return false;
  }

  // Must touch Camiguin places or kiosk topics (tourism, offices, weather, etc.).
  if (linkedToCamiguin || hasKioskTopic) {
    return true;
  }

  // “Who is X?” — allow through so Camiguin-scoped web search can resolve local people
  // (e.g. mayor Yggy). Unrelated celebrities still blocked by UNRELATED_TOPIC_CUES.
  if (isPersonLookupQuery(q)) {
    return true;
  }

  // Short follow-ups that only make sense on a kiosk (hours, fees, hotline, map)
  if (
    /\b(hours?|oras|fee|bayad|hotline|number|numero|map|mapa|form|permit|cedula|download)\b/.test(q)
  ) {
    return true;
  }

  // Everything else (random trivia, general chat, other places) → out of scope.
  return false;
}

function knownIslandPlaceLookup(q: string) {
  const place = extractPlaceName(q);
  if (!place) return false;
  const p = place.toLowerCase();
  return CAMIGUIN_PLACE_CUES.some((cue) => p.includes(cue) || cue.includes(p));
}

