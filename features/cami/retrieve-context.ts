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
    chunks.push({
      id: `directory-${dir.id}`,
      type: dir.type === "building" ? "building" : "directory",
      title: name,
      body: `${description || ""} ${dir.department ?? ""} ${dir.building ?? ""} ${dir.floor ?? ""} ${
        dir.room ?? ""
      } ${head ? `Head / Official: ${head}.` : ""} ${
        dir.contactNumber ? `Contact: ${dir.contactNumber}.` : ""
      } ${dir.email ? `Email: ${dir.email}.` : ""} ${multi}`.trim(),
      href: dir.type === "building" ? "/building-directory" : "/government-directory",
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

function buildDirectFactAnswer(
  query: string,
  ranked: CamiKnowledgeChunk[],
  webHits: Array<{ title: string; snippet: string; url: string }>,
  language: Language
): string | null {
  const q = query.toLowerCase();

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
  "sinulog",
  "governor",
  "gobernador",
  "vice governor",
  "mayor",
  "romualdo",
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
  "hotline",
  "kontakt",
  "kontak",
  "telepono",
  "numero",
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
    "Sorry—Cami only answers questions about Camiguin Province and this kiosk. Ask about tourism, services, events, emergency contacts, maps, downloads, or other info available here.",
    "Pasensya—si Cami ay para sa Camiguin at sa impormasyon ng kiosk lang. Magtanong tungkol sa turismo, serbisyo, events, emergency contacts, mapa, downloads, o iba pang impormasyon dito.",
    "Pasayloa—si Cami para sa Camiguin ug sa impormasyon sa kiosk lang. Pangutana bahin sa turismo, serbisyo, events, emergency contacts, mapa, downloads, o ubang impormasyon dinhi."
  );
}

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

  // Greetings / simple help stay allowed.
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

  // “Where is X?” for an unknown/non-island place → refuse.
  if (isPlaceLookupQuery(q) && !hasCamiguinPlace && !knownIslandPlaceLookup(q)) {
    return false;
  }

  const unrelated = [
    "stock market",
    "write a novel",
    "python code",
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
    "translate this paragraph",
  ];
  if (unrelated.some((item) => q.includes(item)) && !linkedToCamiguin && !hasKioskTopic) {
    return false;
  }

  // Default: treat every other question as about Camiguin Province
  // (weather, food, climate, travel tips, etc. — even without saying “Camiguin”).
  return true;
}

function knownIslandPlaceLookup(q: string) {
  const place = extractPlaceName(q);
  if (!place) return false;
  const p = place.toLowerCase();
  return CAMIGUIN_PLACE_CUES.some((cue) => p.includes(cue) || cue.includes(p));
}
