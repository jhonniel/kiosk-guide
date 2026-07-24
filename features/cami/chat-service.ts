import { db } from "@/lib/db";
import type { Language } from "@/lib/i18n/translations";
import {
  languageReplyInstruction,
  resolveReplyLanguage,
} from "./detect-language";
import {
  buildCamiCorpus,
  buildLocalReply,
  contextMentionsPlace,
  extractPlaceName,
  hasStrongLocalMatch,
  isInScopeQuery,
  isPlaceLookupQuery,
  isPersonLookupQuery,
  isGreetingOrMetaQuery,
  isOfficeQuery,
  isTouristSpotsQuery,
  answerOfficeFromKiosk,
  outOfScopeReply,
  rankChunks,
  suggestTouristSpotsReply,
  unknownPlaceReply,
} from "./retrieve-context";
import { fetchCamiguinWebContext } from "./web-enrichment";
import type { CamiChatResponse, CamiCitation, CamiMessage } from "./types";
import { getLocalizedSetting } from "@/features/settings/resolve-settings";

const SYSTEM_RULES = `You are Cami, the friendly Camiguin Island kiosk assistant for the Provincial Government of Camiguin information kiosk.

LANGUAGE (NON-NEGOTIABLE):
- Fully understand English, Filipino (Tagalog), and Cebuano/Bisaya — including Taglish and Bislish mixes.
- Treat Filipino/Cebuano question words as normal: ano, saan, nasaan, paano, sino, bakit, kailan, kumusta, unsa, asa, kinsa, unsayon/unsaon, ngano, kanus-a, etc.
- Examples of the SAME intent: “How’s the weather?” = “Kumusta ang panahon?” = “Unsa ang panahon?” → answer Camiguin weather.
- “Nasaan ang White Island?” / “Asa ang White Island?” = “Where is White Island?”
- Reply in the SAME language the user just used. If mixed, prefer the dominant language. If unclear, use the kiosk UI language given below.
- Keep replies natural in that language — do not force English when the user wrote Filipino or Cebuano.
- Never answer a Tagalog or Cebuano question in English unless the user mixed mostly English.

STRICT SCOPE (NON-NEGOTIABLE):
- You ONLY know Camiguin Province and the information in THIS kiosk. Nothing else.
- If the question is NOT about Camiguin or this kiosk (random trivia, other cities, coding, jokes, celebrities, world news, homework, etc.), refuse immediately.
- Refusal MUST be in the SAME language as the user (English / Filipino / Cebuano).
- Refusal meaning: “All I know is within Camiguin and this kiosk’s information only.” Then invite a Camiguin/kiosk question.
- EVERY in-scope user question is about Camiguin Province, Philippines — always. Never answer for Manila, Cebu, Davao, or any other place unless the user explicitly asks about travel TO Camiguin from that place.
- If the user asks “how is the weather?”, “kumusta ang panahon?”, “unsa ang panahon?”, etc., answer for Camiguin Province only.
- Prefer KIOSK SYSTEM CONTEXT when it clearly answers (hotlines, offices, events, services, FAQs).
- For office / opisina questions, use ONLY kiosk directory data (building, floor, room, contact, office hours). Do not invent offices.
- If the answer is not in kiosk system data, answer from REFERENCE CONTEXT about Camiguin, or from well-known Camiguin facts (climate, tourism character, municipalities). Still stay Camiguin-only.
- Topics: tourism, weather/climate, festivals/events, emergency contacts, government offices/services, downloads/forms, FAQs, news, maps/municipalities, travel tips for Camiguin, and how to use this kiosk.
- Do NOT answer questions about other cities, provinces, countries, or unrelated topics. Refuse and redirect to Camiguin.
- “Where is X?” / “Nasaan ang X?” / “Asa ang X?” does NOT mean X is in Camiguin. Only locate a place if it appears in the provided context or is a known Camiguin place.
- Never invent towns, barangays, attractions, municipalities, distances, or geography that are not Camiguin-related.
- Camiguin’s municipalities are only: Mambajao, Mahinog, Guinsiliban, Sagay, and Catarman. Do not invent others.
- If a named place is clearly not in Camiguin, say so briefly and invite a Camiguin question.

ANSWER STYLE (VERY IMPORTANT):
- Answer ONLY what the user asked. Do not add extra tips, related topics, module suggestions, or background unless the user asks for them.
- Keep replies short and direct. Prefer 1–3 sentences, or a short bullet list only when listing is required (e.g. tourist spots).
- When asked for tourist spots / places to visit / atraksiyon / what to do in Camiguin, suggest popular Camiguin attractions as a short bullet list (White Island, Katibawasan Falls, Sunken Cemetery, Mantigue Island, Ardent Hot Springs, etc.) and mention Tourism or Map on the kiosk.
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

export async function answerWithCami(opts: {
  message: string;
  language: Language;
  history?: CamiMessage[];
}): Promise<CamiChatResponse> {
  const message = opts.message.trim();
  const uiLanguage = opts.language;
  const language = resolveReplyLanguage(message, uiLanguage);

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

  const [faqs, tourism, events, emergency, services, directories, downloads, announcements, settingsRows] =
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
      db.setting.findMany({
        where: {
          key: { in: ["office_hours_en", "office_hours_fil", "office_hours_bis", "office_hours"] },
        },
      }),
    ]);

  const settingsMap = Object.fromEntries(settingsRows.map((row) => [row.key, row.value]));
  const officeHoursText = getLocalizedSetting(settingsMap, "office_hours", language);

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
      officeHoursText: officeHoursText || undefined,
    },
    language
  );

  // Tourist-spot asks → curated Camiguin suggestions (DB tourism + known highlights)
  if (isTouristSpotsQuery(message)) {
    const tourismChunks = corpus.filter((chunk) => chunk.type === "tourism");
    return {
      reply: suggestTouristSpotsReply(language, tourismChunks),
      citations: tourismChunks.slice(0, 5).map((chunk) => ({
        title: chunk.title,
        href: chunk.href,
        type: chunk.type,
      })),
      source: "local",
      usedWeb: false,
    };
  }

  // Office asks → answer only from kiosk directory / office-hours data
  if (isOfficeQuery(message)) {
    const officeAnswer = answerOfficeFromKiosk(message, corpus, language);
    if (officeAnswer) {
      return {
        reply: officeAnswer.reply,
        citations: officeAnswer.citations.map((chunk) => ({
          title: chunk.title,
          href: chunk.href,
          type: chunk.type,
        })),
        source: "local",
        usedWeb: false,
      };
    }
  }

  const ranked = rankChunks(message, corpus, 8);
  const strongLocal = hasStrongLocalMatch(ranked);

  // Only hit the web when kiosk data can't answer — keeps chat snappy.
  const web = strongLocal
    ? { context: "", hits: [] as Awaited<ReturnType<typeof fetchCamiguinWebContext>>["hits"] }
    : await fetchCamiguinWebContext(message).catch(() => ({ context: "", hits: [] }));

  const webHits = web.hits ?? [];
  const usedWeb = Boolean(web.context) || webHits.length > 0;

  // Person asks with no Camiguin kiosk/web evidence → don't invent world knowledge.
  if (isPersonLookupQuery(message) && !strongLocal && !web.context) {
    return {
      reply: unknownPersonReply(language),
      citations: [],
      source: "local",
      usedWeb: false,
    };
  }

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
      type: "reference" as const,
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

      const replyLangName =
        language === "fil"
          ? "Filipino (Tagalog)"
          : language === "bis"
            ? "Cebuano (Bisaya)"
            : "English";

      const messages = [
        { role: "system", content: SYSTEM_RULES },
        {
          role: "system",
          content: languageReplyInstruction(uiLanguage, message),
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
          content: `${message}\n\n(Answer for Camiguin Province, Philippines. Reply entirely in ${replyLangName}.)`,
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

function unknownPersonReply(language: Language) {
  if (language === "fil") {
    return "Hindi ko mahanap ang taong iyan sa impormasyon ng Camiguin o ng kiosk na ito. Magtanong tungkol sa opisyal, opisina, o iba pang paksang Camiguin.";
  }
  if (language === "bis") {
    return "Wala nako makita ang tawo ana sa impormasyon sa Camiguin o niining kiosk. Pangutana bahin sa opisyal, opisina, o ubang topiko sa Camiguin.";
  }
  return "I couldn’t find that person in Camiguin’s or this kiosk’s information. Ask about local officials, offices, or other Camiguin topics.";
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
