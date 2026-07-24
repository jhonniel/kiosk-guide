"use client";

import { pickLang, type Language } from "@/lib/i18n/translations";
import { resolveReplyLanguage } from "@/features/cami/detect-language";
import {
  answerOfficeFromKiosk,
  buildCamiCorpus,
  buildLocalReply,
  isGreetingOrMetaQuery,
  isInScopeQuery,
  isOfficeQuery,
  outOfScopeReply,
  rankChunks,
} from "@/features/cami/retrieve-context";
import type { CamiChatResponse, CamiMessage } from "@/features/cami/types";
import { getLocalizedSetting } from "@/features/settings/resolve-settings";
import type { KioskOfflineData } from "@/features/offline/types";

type AskCamiOptions = {
  message: string;
  language: Language;
  history?: CamiMessage[];
  offlineBundle?: KioskOfflineData | null;
};

function offlineReply(
  message: string,
  language: Language,
  offlineBundle?: KioskOfflineData | null
): CamiChatResponse {
  const replyLang = resolveReplyLanguage(message, language);
  const officeHoursText = getLocalizedSetting(
    offlineBundle?.settings ?? {},
    "office_hours",
    replyLang
  );
  const corpus = buildCamiCorpus(
    {
      faqs: offlineBundle?.faqs,
      tourism: offlineBundle?.tourism,
      events: offlineBundle?.events,
      emergency: offlineBundle?.emergency,
      services: offlineBundle?.services,
      directories: offlineBundle?.directories,
      downloads: offlineBundle?.downloads,
      announcements: offlineBundle?.announcements,
      officeHoursText: officeHoursText || undefined,
    },
    replyLang
  );

  if (!isInScopeQuery(message)) {
    return {
      reply: outOfScopeReply(replyLang),
      citations: [],
      source: "offline",
      usedWeb: false,
    };
  }

  if (isGreetingOrMetaQuery(message)) {
    return {
      reply: pickLang(
        replyLang,
        "Hi! I’m Cami. Ask me about Camiguin—tourism, services, events, emergency contacts, or other info on this kiosk.",
        "Kumusta! Ako si Cami. Magtanong tungkol sa Camiguin—turismo, serbisyo, events, emergency contacts, o iba pang impormasyon sa kiosk.",
        "Kumusta! Ako si Cami. Pangutana bahin sa Camiguin—turismo, serbisyo, events, emergency contacts, o ubang impormasyon sa kiosk."
      ),
      citations: [],
      source: "offline",
      usedWeb: false,
    };
  }

  if (isOfficeQuery(message)) {
    const officeAnswer = answerOfficeFromKiosk(message, corpus, replyLang);
    if (officeAnswer) {
      return {
        reply: officeAnswer.reply,
        citations: officeAnswer.citations.slice(0, 4).map((chunk) => ({
          title: chunk.title,
          href: chunk.href,
          type: chunk.type,
        })),
        source: "offline",
        usedWeb: false,
      };
    }
  }

  const ranked = rankChunks(message, corpus, 6);
  return {
    reply: buildLocalReply(message, ranked, replyLang),
    citations: ranked.slice(0, 4).map((chunk) => ({
      title: chunk.title,
      href: chunk.href,
      type: chunk.type,
    })),
    source: "offline",
    usedWeb: false,
  };
}

function errorReply(language: Language): CamiChatResponse {
  const replyLang = resolveReplyLanguage("", language);
  return {
    reply: pickLang(
      replyLang,
      "I couldn’t reach the assistant service just now. Please try again.",
      "Hindi maabot ang assistant service sa ngayon. Subukan ulit.",
      "Dili maabot ang assistant service karon. Sulayi pag-usab."
    ),
    citations: [],
    source: "offline",
    usedWeb: false,
  };
}

/** Shared Cami ask used by chat widget and Smart Search. */
export async function askCami({
  message,
  language,
  history = [],
  offlineBundle = null,
}: AskCamiOptions): Promise<CamiChatResponse> {
  const text = message.trim();
  if (!text) {
    return {
      reply: "",
      citations: [],
      source: "local",
      usedWeb: false,
    };
  }

  try {
    const online = typeof navigator === "undefined" ? true : navigator.onLine;
    if (online) {
      const res = await fetch("/api/cami/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language,
          history: history.slice(-8),
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as CamiChatResponse;
        return {
          reply: data.reply,
          citations: data.citations ?? [],
          source: data.source ?? "llm",
          usedWeb: Boolean(data.usedWeb),
        };
      }
    }

    return offlineReply(text, language, offlineBundle);
  } catch {
    try {
      return offlineReply(text, language, offlineBundle);
    } catch {
      return errorReply(language);
    }
  }
}
