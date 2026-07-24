import { db } from "@/lib/db";
import type { Language } from "@/lib/i18n/translations";
import {
  buildCamiCorpus,
  buildLocalReply,
  contextMentionsPlace,
  extractPlaceName,
  hasStrongLocalMatch,
  isInScopeQuery,
  isPlaceLookupQuery,
  isGreetingOrMetaQuery,
  outOfScopeReply,
  rankChunks,
  unknownPlaceReply,
} from "./retrieve-context";
import { fetchCamiguinWebContext } from "./web-enrichment";
import type { CamiChatResponse, CamiCitation, CamiMessage } from "./types";

const SYSTEM_RULES = `You are Cami, the friendly Camiguin Island kiosk assistant for the Provincial Government of Camiguin information kiosk.

LANGUAGE (NON-NEGOTIABLE):
- Fully understand English, Filipino (Tagalog), and Cebuano/Bisaya — including Taglish and Bislish mixes.
- Treat Filipino/Cebuano question words as normal: ano, saan, nasaan, paano, sino, bakit, kailan, kumusta, unsa, asa, kinsa, unsayon/unsaon, ngano, kanus-a, etc.
- Examples of the SAME intent: “How’s the weather?” = “Kumusta ang panahon?” = “Unsa ang panahon?” → answer Camiguin weather.
- “Nasaan ang White Island?” / “Asa ang White Island?” = “Where is White Island?”
- Reply in the SAME language the user just used. If mixed, prefer the dominant language. If unclear, use the kiosk UI language given below.
- Keep replies natural in that language — do not force English when the user wrote Filipino or Cebuano.

STRICT SCOPE (NON-NEGOTIABLE):
- EVERY user question is about Camiguin Province, Philippines — always. Never answer for Manila, Cebu, Davao, or any other place unless the user explicitly asks about travel TO Camiguin from that place.
- If the user asks “how is the weather?”, “kumusta ang panahon?”, “unsa ang panahon?”, etc., answer for Camiguin Province only.
- Prefer KIOSK SYSTEM CONTEXT when it clearly answers (hotlines, offices, events, services, FAQs).
- If the answer is not in kiosk system data, answer from REFERENCE CONTEXT about Camiguin, or from well-known Camiguin facts (climate, tourism character, municipalities). Still stay Camiguin-only.
- Topics: tourism, weather/climate, festivals/events, emergency contacts, government offices/services, downloads/forms, FAQs, news, maps/municipalities, travel tips for Camiguin, and how to use this kiosk.
- Do NOT answer questions about other cities, provinces, countries, or unrelated topics. Refuse and redirect to Camiguin.
- “Where is X?” / “Nasaan ang X?” / “Asa ang X?” does NOT mean X is in Camiguin. Only locate a place if it appears in the provided context or is a known Camiguin place.
- Never invent towns, barangays, attractions, municipalities, distances, or geography that are not Camiguin-related.
- Camiguin’s municipalities are only: Mambajao, Mahinog, Guinsiliban, Sagay, and Catarman. Do not invent others.
- If a named place is clearly not in Camiguin, say so briefly and invite a Camiguin question.

ANSWER STYLE (VERY IMPORTANT):
- Answer ONLY what the user asked. Do not add extra tips, related topics, module suggestions, or background unless the user asks for them.
- Keep replies short and direct. Prefer 1–3 sentences, or a short bullet list only when listing is required.
- Do not pad answers with “you can also…”, “for more details…”, festival lists, travel tips, or office directions unless asked.
- Example: If asked “Who is the governor?” / “Sino ang gobernador?” / “Kinsa ang gobernador?”, reply with the name only (and title if needed).
- Do not invent phone numbers, fees, office hours, or place names that are not in the context.
- Never mention the web, internet search, websites, Wikipedia, DuckDuckGo, Tavily, or external sources to the user.

PRIORITY FOR ACCURACY:
1) Prefer KIOSK SYSTEM CONTEXT for official local details (hotlines, office locations, event schedules, service guidance) when it clearly answers the question.
2) If kiosk context is missing or weak, answer from REFERENCE CONTEXT about Camiguin — or general Camiguin knowledge for soft topics (weather, climate, island character).
3) Never override kiosk emergency numbers, office rooms/contacts, or official service steps with uncertain guesses.
4) If reference context and kiosk conflict on official contacts/services, keep the kiosk version.
5) If you truly cannot answer about Camiguin, say you don’t have that Camiguin info yet — in the user's language — do not invent official numbers or service steps.
6) If the question is explicitly about another place (not Camiguin), refuse immediately.`;

function languageLabel(language: Language) {
  if (language === "fil") return "Filipino (Tagalog)";
  if (language === "bis") return "Cebuano (Bisaya)";
  return "English";
}

function languageReplyInstruction(language: Language, message: string) {
  const detected = detectMessageLanguage(message);
  const ui = languageLabel(language);
  const replyIn =
    detected === "fil"
      ? "Filipino (Tagalog)"
      : detected === "bis"
        ? "Cebuano (Bisaya)"
        : detected === "en"
          ? "English"
          : ui;

  return `Kiosk UI language: ${ui}.
Detected user message language: ${replyIn}.
Reply in ${replyIn}. Understand Filipino and Cebuano questions fully even if the UI is English.`;
}

function detectMessageLanguage(message: string): Language | "mixed" {
  const q = message.toLowerCase();
  const filHits =
    (q.match(
      /\b(ang|mga|sa|ng|na|ay|po|ba|naman|kumusta|nasaan|saan|paano|ano|sino|bakit|kailan|magtanong|paki|opo|hindi|walang|meron|mayroon|gusto|pwede|puwede|salamat|pasensya|panahon)\b/g
    )?.length ?? 0) + (/[ñ]/i.test(q) ? 1 : 0);
  const bisHits =
    q.match(
      /\b(asa|unsa|kinsa|unsaon|unsayon|ngano|kanus-a|naa|wala|ko|ka|mi|ninyo|inyo|kani|kana|mao|pangutana|pasayloa|maayong|panahon|nagaulan|init)\b/g
    )?.length ?? 0;
  const enHits =
    q.match(
      /\b(the|what|where|when|who|how|is|are|can|please|weather|governor|office|emergency|tourism|download|map)\b/g
    )?.length ?? 0;

  if (filHits >= 2 && filHits >= bisHits && filHits >= enHits) return "fil";
  if (bisHits >= 2 && bisHits >= filHits && bisHits >= enHits) return "bis";
  if (enHits >= 2 && enHits >= filHits && enHits >= bisHits) return "en";
  if (filHits > 0 && filHits >= bisHits) return "fil";
  if (bisHits > 0) return "bis";
  if (enHits > 0) return "en";
  return "mixed";
}

export async function answerWithCami(opts: {
  message: string;
  language: Language;
  history?: CamiMessage[];
}): Promise<CamiChatResponse> {
  const message = opts.message.trim();
  const language = opts.language;

  if (!message) {
    return {
      reply:
        language === "fil"
          ? "Magtanong tungkol sa Camiguin o sa impormasyon ng kiosk."
          : language === "bis"
            ? "Pangutana bahin sa Camiguin o sa impormasyon sa kiosk."
            : "Ask me about Camiguin or this kiosk’s information.",
      citations: [],
      source: "local",
      usedWeb: false,
    };
  }

  if (!isInScopeQuery(message)) {
    return {
      reply: outOfScopeReply(language),
      citations: [],
      source: "local",
      usedWeb: false,
    };
  }

  if (isGreetingOrMetaQuery(message)) {
    return {
      reply: pickLangGreeting(language),
      citations: [],
      source: "local",
      usedWeb: false,
    };
  }

  const [faqs, tourism, events, emergency, services, directories, downloads, announcements] =
    await Promise.all([
      db.faq.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.tourism.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.event.findMany({ where: { isActive: true }, orderBy: { startDate: "asc" } }),
      db.emergencyContact.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.directory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.download.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      db.announcement.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        take: 12,
      }),
    ]);

  const corpus = buildCamiCorpus(
    {
      faqs,
      tourism,
      events,
      emergency,
      services,
      directories,
      downloads,
      announcements,
    },
    language
  );

  const ranked = rankChunks(message, corpus, 8);
  const strongLocal = hasStrongLocalMatch(ranked);

  // Only hit the web when kiosk data can't answer — keeps chat snappy.
  const web = strongLocal
    ? { context: "", hits: [] as Awaited<ReturnType<typeof fetchCamiguinWebContext>>["hits"] }
    : await fetchCamiguinWebContext(message).catch(() => ({ context: "", hits: [] }));

  const webHits = web.hits ?? [];
  const usedWeb = Boolean(web.context) || webHits.length > 0;

  const place = extractPlaceName(message);
  if (
    place &&
    isPlaceLookupQuery(message) &&
    !contextMentionsPlace(
      place,
      ranked,
      webHits.map((hit) => ({ title: hit.title, snippet: hit.snippet }))
    )
  ) {
    return {
      reply: unknownPlaceReply(language, place),
      citations: [],
      source: "local",
      usedWeb: false,
    };
  }

  // Prefer grounded context, but still allow the LLM for Camiguin-scoped
  // soft questions (weather, climate, etc.) when kiosk/web has nothing yet.
  const apiKey = process.env.OPENAI_API_KEY || process.env.CAMI_API_KEY;
  const canUseLlm = Boolean(apiKey);

  if (!strongLocal && !web.context && !canUseLlm) {
    return {
      reply: missingCamiguinInfoReply(language),
      citations: [],
      source: "local",
      usedWeb: false,
    };
  }

  // When kiosk match is weak, still show web citations so the answer is grounded outside the DB.
  const citationLocal = strongLocal ? ranked.slice(0, 4) : ranked.slice(0, 1);
  const citationWeb = !strongLocal || usedWeb ? webHits.slice(0, 4) : [];

  const citations: CamiCitation[] = [
    ...citationLocal.map((chunk) => ({
      title: chunk.title,
      href: chunk.href,
      type: chunk.type,
    })),
    ...citationWeb.map((hit) => ({
      title: hit.title,
      href: hit.url,
      type: "reference",
    })),
  ];

  const systemContext = ranked
    .map(
      (chunk, index) =>
        `[${index + 1}] (${chunk.type}) ${chunk.title}\n${chunk.body}\nLink: ${chunk.href}`
    )
    .join("\n\n");

  const model = process.env.CAMI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");

  if (apiKey) {
    try {
      const history = (opts.history ?? []).slice(-6);
      const localGuidance = strongLocal
        ? `KIOSK SYSTEM CONTEXT (strong match — prefer this for official details):\n${systemContext}`
        : systemContext
          ? `KIOSK SYSTEM CONTEXT (weak/generic match only — prefer REFERENCE CONTEXT if it answers the question better):\n${systemContext}`
          : "KIOSK SYSTEM CONTEXT: No strong local matches. Answer about Camiguin Province using REFERENCE CONTEXT or known Camiguin facts.";

      const messages = [
        { role: "system", content: SYSTEM_RULES },
        {
          role: "system",
          content: languageReplyInstruction(language, message),
        },
        {
          role: "system",
          content:
            "LOCATION LOCK: The user is standing at a Camiguin Province kiosk. Reinterpret every question as about Camiguin Province, Philippines (e.g. weather / panahon → Camiguin weather).",
        },
        {
          role: "system",
          content: localGuidance,
        },
        ...(web.context
          ? [
              {
                role: "system" as const,
                content: strongLocal
                  ? `REFERENCE CONTEXT (supplemental; do not mention sources to the user):\n${web.context}`
                  : `REFERENCE CONTEXT (PRIMARY — kiosk has no strong match; answer from this; do not mention sources to the user):\n${web.context}`,
              },
            ]
          : [
              {
                role: "system" as const,
                content:
                  "REFERENCE CONTEXT: No extra hits. Still answer for Camiguin Province if you can (weather, climate, tourism character). Do not invent official hotlines, fees, or service steps. Do not answer about places outside Camiguin.",
              },
            ]),
        ...history.map((item) => ({ role: item.role, content: item.content })),
        {
          role: "user",
          content: `${message}\n\n(Answer for Camiguin Province, Philippines. Reply in the user's language.)`,
        },
      ];

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) {
          return { reply, citations, source: "llm", usedWeb };
        }
      }
    } catch {
      // fall through to local reply
    }
  }

  if (!strongLocal && !web.context) {
    return {
      reply: missingCamiguinInfoReply(language),
      citations: [],
      source: "local",
      usedWeb: false,
    };
  }

  return {
    reply: buildLocalReply(
      message,
      ranked,
      language,
      webHits.map((hit) => ({ title: hit.title, snippet: hit.snippet, url: hit.url }))
    ),
    citations,
    source: "local",
    usedWeb,
  };
}

function missingCamiguinInfoReply(language: Language) {
  if (language === "fil") {
    return "Wala pa akong detalyadong sagot diyan para sa Camiguin. Subukan magtanong tungkol sa turismo, serbisyo, events, o emergency contacts sa isla.";
  }
  if (language === "bis") {
    return "Wala pa koy detalyadong tubag ana para sa Camiguin. Sulayi pangutana bahin sa turismo, serbisyo, events, o emergency contacts sa isla.";
  }
  return "I don’t have that Camiguin detail yet. Try asking about tourism, services, events, or emergency contacts on the island.";
}

function pickLangGreeting(language: Language) {
  if (language === "fil") {
    return "Kumusta! Ako si Cami. Magtanong tungkol sa Camiguin—turismo, serbisyo, events, emergency contacts, o iba pang impormasyon sa kiosk.";
  }
  if (language === "bis") {
    return "Kumusta! Ako si Cami. Pangutana bahin sa Camiguin—turismo, serbisyo, events, emergency contacts, o ubang impormasyon sa kiosk.";
  }
  return "Hi! I’m Cami. Ask me about Camiguin—tourism, services, events, emergency contacts, or other info on this kiosk.";
}
