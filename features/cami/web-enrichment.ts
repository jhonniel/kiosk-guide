/**
 * Camiguin-scoped web search for Cami.
 * System/kiosk data still wins for official hotlines, offices, and local schedules.
 */

import {
  extractPlaceName,
  isPersonLookupQuery,
  isPlaceLookupQuery,
  textMentionsPlace,
} from "./retrieve-context";

export type WebSearchHit = {
  title: string;
  url: string;
  snippet: string;
  provider: string;
};

export type WebSearchResult = {
  context: string;
  hits: WebSearchHit[];
};

function ensureCamiguinQuery(query: string) {
  const q = query.trim();
  // Help web search when the question is in Filipino/Cebuano.
  const normalized = q
    .replace(/\bkumusta(?:\s+ang)?\s+panahon\b/gi, "weather")
    .replace(/\bunsa(?:\s+ang)?\s+panahon\b/gi, "weather")
    .replace(/\bano(?:\s+ang)?\s+panahon\b/gi, "weather")
    .replace(/\bnasaan(?:\s+ang)?\b/gi, "where is")
    .replace(/\bsaan(?:\s+ang)?\b/gi, "where is")
    .replace(/\basa(?:\s+ang)?\b/gi, "where is")
    .replace(/\bsino(?:\s+(?:si|ang))?\b/gi, "who is")
    .replace(/\bkinsa(?:\s+(?:si|ang))?\b/gi, "who is")
    .replace(/\bpaano\b/gi, "how to")
    .replace(/\bunsaon\b/gi, "how to")
    .replace(/\bunsayon\b/gi, "how to");
  if (/camiguin/i.test(normalized)) return normalized;
  return `${normalized} Camiguin Philippines`;
}

function knownCamiguinPlaceCue(q: string) {
  return /camiguin|white island|yumbing|hibok|lanzones|mantigue|katibawasan|sunken|cemetery|ardent|panaad|benoni|mambajao|mahinog|catarman|guinsiliban|sagay|island/.test(
    q
  );
}

function hitMentionsQueriedPlace(query: string, hit: WebSearchHit) {
  const place = extractPlaceName(query);
  if (!place || /^camiguin$/i.test(place.trim())) return true;
  if (!isPlaceLookupQuery(query)) return true;
  return textMentionsPlace(place, `${hit.title} ${hit.snippet}`);
}

function isLikelyCamiguinHit(title: string, snippet: string, url: string) {
  const hay = `${title} ${snippet} ${url}`.toLowerCase();
  const strong = [
    "camiguin",
    "mambajao",
    "mahinog",
    "catarman",
    "guinsiliban",
    "sagay, camiguin",
    "hibok-hibok",
    "hibok hibok",
    "lanzones festival",
    "mantigue",
    "katibawasan",
    "white island",
    "sunken cemetery",
    "benoni",
    "yumbing",
    "panaad",
    "ardent hot",
    "romualdo",
    "governor of camiguin",
    "mayor of mambajao",
    "yggy",
    "yñigo",
    "ynigo jesus",
  ];
  const weakNoise = ["forest rat", "camiguin forest", "genus ", "species of"];
  if (weakNoise.some((item) => hay.includes(item))) return false;
  return strong.some((cue) => hay.includes(cue));
}

/** Curated Camiguin people facts when free web search has thin coverage. */
function knownCamiguinPeopleHits(query: string): WebSearchHit[] {
  const q = query.toLowerCase();
  const hits: WebSearchHit[] = [];

  if (
    /\b(yggy|yñigo|ynigo)\b/.test(q) ||
    (/\b(mayor|alkalde)\b/.test(q) && !/\b(governor|gobernador|gubernador)\b/.test(q)) ||
    (isPersonLookupQuery(q) && /\b(yggy|yñigo|ynigo)\b/.test(q))
  ) {
    hits.push({
      title: "Mayor Yñigo Jesus “Yggy” Romualdo",
      url: "https://en.wikipedia.org/wiki/Mambajao",
      snippet:
        "Yñigo Jesus dela Fuente Romualdo, commonly known as Yggy Romualdo, is the Mayor of Mambajao, the capital municipality of Camiguin Province, Philippines. He is a member of the Romualdo family active in Camiguin public service.",
      provider: "camiguin-officials",
    });
  }

  if (
    /\b(governor|gobernador|gubernador)\b/.test(q) ||
    (isPersonLookupQuery(q) && /\b(jj|xavier)\b/.test(q) && /\bromualdo\b/.test(q))
  ) {
    hits.push({
      title: "Governor Xavier Jesus “JJ” Romualdo",
      url: "https://en.wikipedia.org/wiki/Xavier_Jesus_Romualdo",
      snippet:
        "Xavier Jesus Dela Fuente Romualdo (JJ Romualdo) is a Filipino politician who has served as Governor of Camiguin. He is part of the Romualdo family of Camiguin public officials.",
      provider: "camiguin-officials",
    });
  }

  return hits;
}

async function fetchKnownTopicPages(query: string): Promise<WebSearchHit[]> {
  const q = query.toLowerCase();
  // Don't dump a generic Camiguin overview into "where is <unknown place>" searches.
  if (isPlaceLookupQuery(query) && !knownCamiguinPlaceCue(q)) {
    return [];
  }

  const titles: string[] = ["Camiguin"];
  if (/white island|yumbing/.test(q)) titles.push("White_Island_(Philippines)");
  if (/hibok/.test(q)) titles.push("Hibok-Hibok");
  if (/lanzones|festival/.test(q)) titles.push("Mambajao");
  if (/mantigue/.test(q)) titles.push("Mantigue");
  if (/governor|gobernador|romualdo|who is the|yggy|yñigo|ynigo|mayor|alkalde/.test(q)) {
    titles.unshift("Xavier_Jesus_Romualdo");
    titles.unshift("Mambajao");
  }
  if (/panaad|holy week|pilgrim|sinulog|ardent|katibawasan|sunken|cemetery|falls/.test(q)) {
    titles.push("Camiguin");
  }
  if (/weather|climate|ulan|init|rainy|temperature|forecast|panahon/.test(q)) {
    titles.unshift("Camiguin");
  }

  const unique = [...new Set(titles)].slice(0, 3);
  const hits: WebSearchHit[] = [];

  for (const title of unique) {
    try {
      const res = await fetchWithTimeout(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        3500
      );
      if (!res.ok) continue;
      const data = (await res.json()) as {
        title?: string;
        extract?: string;
        description?: string;
        content_urls?: { desktop?: { page?: string } };
        type?: string;
      };
      if (data.type === "disambiguation" || !data.title) continue;
      const snippet = (data.extract || data.description || "").trim();
      if (!snippet) continue;
      const url = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${title}`;
      if (
        data.title !== "Camiguin" &&
        data.title !== "Xavier Jesus Romualdo" &&
        !isLikelyCamiguinHit(data.title, snippet, url) &&
        !/camiguin|mambajao|hibok|mantigue|white island|romualdo|governor/i.test(
          `${data.title} ${snippet}`
        )
      ) {
        continue;
      }
      hits.push({
        title: data.title,
        url,
        snippet: snippet.slice(0, 500),
        provider: "wikipedia",
      });
    } catch {
      // ignore
    }
  }

  return hits;
}

async function fetchWithTimeout(url: string, ms: number, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "CamiguinKioskCami/1.0",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function dedupeHits(hits: WebSearchHit[]) {
  const seen = new Set<string>();
  const out: WebSearchHit[] = [];
  for (const hit of hits) {
    const key = (hit.url || hit.title).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}

async function searchWikipedia(query: string): Promise<WebSearchHit[]> {
  const searchUrl =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: ensureCamiguinQuery(query),
      srlimit: "5",
      format: "json",
      origin: "*",
    });

  const searchRes = await fetchWithTimeout(searchUrl, 4000);
  if (!searchRes.ok) return [];
  const searchData = (await searchRes.json()) as {
    query?: { search?: Array<{ title: string; snippet?: string; pageid?: number }> };
  };
  const pages = searchData.query?.search ?? [];
  if (!pages.length) return [];

  const titles = pages.map((page) => page.title).slice(0, 4);
  const extractUrl =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      prop: "extracts|info",
      exintro: "1",
      explaintext: "1",
      redirects: "1",
      inprop: "url",
      titles: titles.join("|"),
      format: "json",
      origin: "*",
    });

  const extractRes = await fetchWithTimeout(extractUrl, 4500);
  if (!extractRes.ok) {
    return pages
      .map((page) => ({
        title: page.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
        snippet: (page.snippet ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        provider: "wikipedia",
      }))
      .filter((hit) => isLikelyCamiguinHit(hit.title, hit.snippet, hit.url));
  }

  const extractData = (await extractRes.json()) as {
    query?: {
      pages?: Record<
        string,
        { title?: string; extract?: string; fullurl?: string; missing?: boolean }
      >;
    };
  };

  const hits: WebSearchHit[] = [];
  for (const page of Object.values(extractData.query?.pages ?? {})) {
    if (!page || page.missing || !page.title) continue;
    const snippet = (page.extract ?? "").trim();
    const url =
      page.fullurl ||
      `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`;
    if (!snippet) continue;
    if (!isLikelyCamiguinHit(page.title, snippet, url)) continue;
    hits.push({
      title: page.title,
      url,
      snippet: snippet.slice(0, 500),
      provider: "wikipedia",
    });
  }
  return hits;
}

async function searchDuckDuckGo(query: string): Promise<WebSearchHit[]> {
  const scoped = ensureCamiguinQuery(query);
  const url =
    "https://api.duckduckgo.com/?" +
    new URLSearchParams({
      q: scoped,
      format: "json",
      no_html: "1",
      skip_disambig: "1",
    });

  try {
    const res = await fetchWithTimeout(url, 4500);
    if (!res.ok) {
      console.info(`[cami:web] DuckDuckGo HTTP ${res.status} for "${scoped}"`);
      return [];
    }
    const data = (await res.json()) as {
      AbstractText?: string;
      AbstractURL?: string;
      Heading?: string;
      Answer?: string;
      AnswerType?: string;
      Definition?: string;
      DefinitionURL?: string;
      RelatedTopics?: Array<
        | { Text?: string; FirstURL?: string }
        | { Name?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }
      >;
      Results?: Array<{ Text?: string; FirstURL?: string }>;
    };

    const hits: WebSearchHit[] = [];

    if (data.AbstractText) {
      const title = data.Heading || "DuckDuckGo summary";
      const abstractUrl = data.AbstractURL || "";
      if (isLikelyCamiguinHit(title, data.AbstractText, abstractUrl)) {
        hits.push({
          title,
          url: abstractUrl || "https://duckduckgo.com/",
          snippet: data.AbstractText.slice(0, 500),
          provider: "duckduckgo",
        });
      }
    }

    if (data.Answer) {
      const answerText = String(data.Answer);
      if (isLikelyCamiguinHit(data.Heading || scoped, answerText, "")) {
        hits.push({
          title: data.Heading || "DuckDuckGo answer",
          url: data.AbstractURL || "https://duckduckgo.com/",
          snippet: answerText.slice(0, 500),
          provider: "duckduckgo",
        });
      }
    }

    if (data.Definition) {
      const definition = data.Definition.slice(0, 400);
      const title = data.Heading || "DuckDuckGo definition";
      const url = data.DefinitionURL || "https://duckduckgo.com/";
      if (isLikelyCamiguinHit(title, definition, url) && hitMentionsQueriedPlace(query, {
        title,
        url,
        snippet: definition,
        provider: "duckduckgo",
      })) {
        hits.push({
          title,
          url,
          snippet: definition,
          provider: "duckduckgo",
        });
      }
    }

    const related: Array<{ Text?: string; FirstURL?: string }> = [];
    for (const item of data.RelatedTopics ?? []) {
      if ("Text" in item && item.Text) related.push(item);
      if ("Topics" in item && item.Topics) related.push(...item.Topics);
    }
    for (const item of [...(data.Results ?? []), ...related].slice(0, 8)) {
      if (!item.Text || !item.FirstURL) continue;
      const title = item.Text.split(" - ")[0]?.trim() || item.Text.slice(0, 80);
      if (!isLikelyCamiguinHit(title, item.Text, item.FirstURL)) continue;
      hits.push({
        title,
        url: item.FirstURL,
        snippet: item.Text.slice(0, 400),
        provider: "duckduckgo",
      });
    }

    const unique = dedupeHits(hits);
    console.info(
      `[cami:web] DuckDuckGo "${scoped}" → ${unique.length} hit(s)` +
        (unique.length
          ? `: ${unique.map((hit) => hit.title).join(" | ")}`
          : " (empty Instant Answer)")
    );
    return unique;
  } catch (error) {
    console.warn(
      `[cami:web] DuckDuckGo failed for "${scoped}":`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

function prioritizeHits(hits: WebSearchHit[]) {
  const rank = (provider: string) => {
    if (provider === "tavily" || provider === "brave" || provider === "serper") return 0;
    if (provider === "duckduckgo") return 1;
    return 2;
  };
  return [...hits].sort((a, b) => rank(a.provider) - rank(b.provider));
}

async function searchBrave(query: string): Promise<WebSearchHit[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY || process.env.BRAVE_API_KEY;
  if (!apiKey) return [];

  const url =
    "https://api.search.brave.com/res/v1/web/search?" +
    new URLSearchParams({
      q: ensureCamiguinQuery(query),
      count: "6",
      search_lang: "en",
      country: "PH",
    });

  const res = await fetchWithTimeout(url, 4500, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    web?: { results?: Array<{ title?: string; url?: string; description?: string }> };
  };

  return (data.web?.results ?? [])
    .map((item) => ({
      title: item.title ?? "Web result",
      url: item.url ?? "",
      snippet: (item.description ?? "").slice(0, 400),
      provider: "brave",
    }))
    .filter((hit) => hit.url && isLikelyCamiguinHit(hit.title, hit.snippet, hit.url));
}

async function searchTavily(query: string): Promise<WebSearchHit[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.info("[cami:web] Tavily skipped (no TAVILY_API_KEY)");
    return [];
  }

  try {
    const scoped = ensureCamiguinQuery(query);
    const res = await fetchWithTimeout("https://api.tavily.com/search", 6000, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: scoped,
        search_depth: "basic",
        include_answer: true,
        max_results: 6,
      }),
    });
    if (!res.ok) {
      console.warn(`[cami:web] Tavily HTTP ${res.status} for "${scoped}"`);
      return [];
    }

    const data = (await res.json()) as {
      answer?: string;
      results?: Array<{ title?: string; url?: string; content?: string }>;
    };

    const hits: WebSearchHit[] = [];
    if (data.answer?.trim()) {
      const answer = data.answer.trim().slice(0, 500);
      const candidate: WebSearchHit = {
        title: "Camiguin reference summary",
        url: data.results?.[0]?.url || "https://www.tavily.com",
        snippet: answer,
        provider: "tavily",
      };
      if (isLikelyCamiguinHit(candidate.title, answer, candidate.url) && hitMentionsQueriedPlace(query, candidate)) {
        hits.push(candidate);
      }
    }

    for (const item of data.results ?? []) {
      if (!item.url) continue;
      const title = item.title ?? "Web result";
      const snippet = (item.content ?? "").slice(0, 400);
      // Query is already Camiguin-scoped; keep results that mention the island or PH tourism cues.
      if (!isLikelyCamiguinHit(title, snippet, item.url) && !/camiguin|philippines/i.test(`${title} ${snippet} ${item.url}`)) {
        continue;
      }
      hits.push({
        title,
        url: item.url,
        snippet,
        provider: "tavily",
      });
    }

    const unique = dedupeHits(hits);
    console.info(
      `[cami:web] Tavily "${scoped}" → ${unique.length} hit(s)` +
        (unique.length ? `: ${unique.map((hit) => hit.title).slice(0, 3).join(" | ")}` : "")
    );
    return unique;
  } catch (error) {
    console.warn(
      "[cami:web] Tavily failed:",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

async function searchSerper(query: string): Promise<WebSearchHit[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const res = await fetchWithTimeout("https://google.serper.dev/search", 5000, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      q: ensureCamiguinQuery(query),
      gl: "ph",
      hl: "en",
      num: 6,
    }),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string }>;
    answerBox?: { answer?: string; snippet?: string; title?: string; link?: string };
  };

  const hits: WebSearchHit[] = [];
  if (data.answerBox?.answer || data.answerBox?.snippet) {
    const snippet = data.answerBox.answer || data.answerBox.snippet || "";
    const title = data.answerBox.title || "Web answer";
    const url = data.answerBox.link || "";
    if (isLikelyCamiguinHit(title, snippet, url)) {
      hits.push({ title, url: url || "https://www.google.com", snippet: snippet.slice(0, 400), provider: "serper" });
    }
  }

  for (const item of data.organic ?? []) {
    if (!item.link) continue;
    const title = item.title ?? "Web result";
    const snippet = item.snippet ?? "";
    if (!isLikelyCamiguinHit(title, snippet, item.link)) continue;
    hits.push({
      title,
      url: item.link,
      snippet: snippet.slice(0, 400),
      provider: "serper",
    });
  }

  return hits;
}

/** Always scopes queries to Camiguin and filters non-island results. */
export async function fetchCamiguinWebContext(query: string): Promise<WebSearchResult> {
  const primary = ensureCamiguinQuery(query);
  const secondaryQueries = buildSecondaryQueries(query);
  const secondary = secondaryQueries[0];

  // Keep fan-out small: prefer one paid provider + one free path, then known pages.
  const settled = await Promise.allSettled([
    searchTavily(query),
    searchSerper(query),
    searchDuckDuckGo(query),
    Promise.resolve(knownCamiguinPeopleHits(query)),
    fetchKnownTopicPages(query),
    searchWikipedia(primary),
    secondary && secondary.toLowerCase() !== primary.toLowerCase()
      ? searchWikipedia(secondary)
      : Promise.resolve([]),
  ]);

  const allHits = settled.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  // Short-circuit noise: keep top Camiguin hits only.
  const hits = prioritizeHits(dedupeHits(allHits))
    .filter((hit) => hitMentionsQueriedPlace(query, hit))
    .slice(0, 5);

  const byProvider = hits.reduce<Record<string, number>>((acc, hit) => {
    acc[hit.provider] = (acc[hit.provider] ?? 0) + 1;
    return acc;
  }, {});

  console.info(`[cami:web] query="${query}" → ${hits.length} total hit(s)`, byProvider);

  if (!hits.length) {
    return { context: "", hits: [] };
  }

  const context = hits
    .map(
      (hit, index) =>
        `[Ref ${index + 1}] ${hit.title}\n${hit.snippet}\nSource: ${hit.url} (${hit.provider})`
    )
    .join("\n\n")
    .slice(0, 6000);

  return { context, hits };
}

function buildSecondaryQueries(query: string) {
  const q = query.toLowerCase();
  const extras: string[] = [];

  if (/white island|yumbing/.test(q)) extras.push("White Island Camiguin");
  if (/katibawasan|falls/.test(q)) extras.push("Katibawasan Falls Camiguin");
  if (/sunken|cemetery|bonbon/.test(q)) extras.push("Sunken Cemetery Camiguin");
  if (/mantigue/.test(q)) extras.push("Mantigue Island Camiguin");
  if (/hibok/.test(q)) extras.push("Mount Hibok-Hibok");
  if (/lanzones|festival/.test(q)) extras.push("Lanzones Festival Camiguin");
  if (/panaad|holy week/.test(q)) extras.push("Panaad Camiguin");
  if (/sinulog/.test(q)) extras.push("Sinulog Camiguin");
  if (/ardent|hot spring/.test(q)) extras.push("Ardent Hot Springs Camiguin");
  if (/governor|gobernador|romualdo|who is the|yggy|yñigo|ynigo|mayor|alkalde/.test(q)) {
    extras.push("Yñigo Yggy Romualdo Mayor Mambajao Camiguin");
    extras.push("Xavier Jesus Romualdo Camiguin governor");
  }
  if (/benoni|how to get|arrive|transport/.test(q)) extras.push("Camiguin travel Benoni Port");
  if (/weather|climate|ulan|init|tag-ulan|tag-init|rainy|temperature|forecast|panahon/.test(q)) {
    extras.push("Camiguin weather climate Philippines");
  }

  // Never inject generic tourism for place lookups — it causes invented geography.
  if (!extras.length && !(isPlaceLookupQuery(query) && !knownCamiguinPlaceCue(q))) {
    extras.push("Camiguin tourism");
  }
  return extras.slice(0, 3);
}
