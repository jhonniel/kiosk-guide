"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { useOffline } from "@/components/providers/offline-provider";
import { searchAllOffline } from "@/features/offline/client-services";
import { formatSearchType } from "@/features/search/kiosk-catalog";
import type { CamiChatResponse } from "@/features/cami/types";
import { t, SMART_SEARCH_EXAMPLES } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import { kioskSyncFetch } from "@/lib/kiosk-sync-fetch";
import { loadCitizensCharterOfflineData } from "@/lib/offline/idb";
import type { CitizensCharterOfflineBundle } from "@/features/offline/types";
import type { CharterEditionView } from "@/features/citizens-charter/types";
import type { SearchResult } from "@/features/search/search-service";

const TYPE_MS = 48;
const ERASE_MS = 28;
const HOLD_MS = 1400;
const GAP_MS = 350;
const CAMI_ICON = "/images/cami/cami-badge-solid.jpg";

type TypewriterPhase = "typing" | "holding" | "erasing" | "gap";

/** Only allow in-app kiosk routes — never open external/browser tabs. */
function normalizeKioskHref(href: string): string | null {
  const raw = href.trim();
  if (!raw) return null;
  if (raw.startsWith("/")) return raw;
  try {
    const url = new URL(raw, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (typeof window !== "undefined" && url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function SmartSearch() {
  const { language } = useKiosk();
  const { offlineData } = useOffline();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [camiReply, setCamiReply] = useState<CamiChatResponse | null>(null);
  const [camiBusy, setCamiBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [charterEdition, setCharterEdition] = useState<CharterEditionView | null>(null);
  const [hint, setHint] = useState(() => SMART_SEARCH_EXAMPLES.en[0] ?? "");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef(query);
  const exampleIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const phaseRef = useRef<TypewriterPhase>("holding");
  const camiRequestIdRef = useRef(0);

  queryRef.current = query;

  useEffect(() => {
    const examples = SMART_SEARCH_EXAMPLES[language] ?? SMART_SEARCH_EXAMPLES.en;
    exampleIndexRef.current = 0;
    charIndexRef.current = examples[0]?.length ?? 0;
    phaseRef.current = "holding";
    setHint(examples[0] ?? "");

    let alive = true;
    let timeoutId = 0;

    const schedule = (ms: number) => {
      timeoutId = window.setTimeout(tick, ms);
    };

    const tick = () => {
      if (!alive) return;

      if (queryRef.current.trim()) {
        schedule(400);
        return;
      }

      const fullText = examples[exampleIndexRef.current % examples.length] ?? "";
      const phase = phaseRef.current;

      if (phase === "typing") {
        charIndexRef.current = Math.min(fullText.length, charIndexRef.current + 1);
        setHint(fullText.slice(0, charIndexRef.current));
        if (charIndexRef.current >= fullText.length) {
          phaseRef.current = "holding";
          schedule(HOLD_MS);
          return;
        }
        schedule(TYPE_MS);
        return;
      }

      if (phase === "holding") {
        phaseRef.current = "erasing";
        schedule(ERASE_MS);
        return;
      }

      if (phase === "erasing") {
        charIndexRef.current = Math.max(0, charIndexRef.current - 1);
        setHint(fullText.slice(0, charIndexRef.current));
        if (charIndexRef.current <= 0) {
          phaseRef.current = "gap";
          schedule(GAP_MS);
          return;
        }
        schedule(ERASE_MS);
        return;
      }

      exampleIndexRef.current = (exampleIndexRef.current + 1) % examples.length;
      charIndexRef.current = 0;
      phaseRef.current = "typing";
      schedule(TYPE_MS);
    };

    schedule(HOLD_MS);

    return () => {
      alive = false;
      window.clearTimeout(timeoutId);
    };
  }, [language]);

  useEffect(() => {
    if (!expanded && !query.trim()) return;

    let cancelled = false;
    (async () => {
      const cached = await loadCitizensCharterOfflineData<CitizensCharterOfflineBundle>();
      if (!cancelled && cached?.citizensCharter) {
        setCharterEdition(cached.citizensCharter);
        return;
      }
      if (!navigator.onLine) return;
      try {
        const res = await kioskSyncFetch("/api/kiosk/citizens-charter", { cache: "force-cache" });
        if (!res.ok) return;
        const data = (await res.json()) as CitizensCharterOfflineBundle;
        if (!cancelled && data.citizensCharter) setCharterEdition(data.citizensCharter);
      } catch {
        // ignore — charter search is best-effort
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded, query]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setCamiReply(null);
      setCamiBusy(false);
      setIsOpen(false);
      return;
    }

    const searchTimer = window.setTimeout(async () => {
      if (offlineData) {
        setResults(searchAllOffline(query, language, offlineData, charterEdition));
        setIsOpen(true);
        return;
      }

      try {
        const res = await kioskSyncFetch(`/api/search?q=${encodeURIComponent(query)}&lang=${language}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setIsOpen(true);
      } catch {
        setResults([]);
        setIsOpen(true);
      }
    }, 200);

    const camiTimer = window.setTimeout(async () => {
      const requestId = ++camiRequestIdRef.current;
      setCamiBusy(true);
      setIsOpen(true);
      try {
        const { askCami } = await import("@/features/cami/client");
        const data = await askCami({
          message: query,
          language,
          offlineBundle: offlineData,
        });
        if (camiRequestIdRef.current !== requestId) return;
        setCamiReply(data.reply ? data : null);
      } catch {
        if (camiRequestIdRef.current !== requestId) return;
        setCamiReply(null);
      } finally {
        if (camiRequestIdRef.current === requestId) setCamiBusy(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(searchTimer);
      window.clearTimeout(camiTimer);
    };
  }, [query, language, offlineData, charterEdition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
        if (!query.trim()) setExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query]);

  function handleSelect(href: string) {
    const path = normalizeKioskHref(href);
    if (!path) return;
    setIsOpen(false);
    setExpanded(false);
    setQuery("");
    setCamiReply(null);
    router.push(path);
  }

  function expand() {
    setExpanded(true);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  const showHint = !query.trim();
  const internalCitations =
    camiReply?.citations?.filter((citation) => Boolean(normalizeKioskHref(citation.href))) ?? [];
  const showPanel =
    expanded && isOpen && Boolean(query.trim()) && (camiBusy || Boolean(camiReply) || results.length > 0);

  return (
    <div className="flex justify-center">
      <div
        ref={containerRef}
        className={cn(
          "relative w-full transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          expanded ? "max-w-full" : "max-w-[54rem]"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-[28px] bg-[#e8eef6] px-4 py-3 shadow-[0_8px_24px_rgba(15,35,70,0.06)]",
            "transition-[gap,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            expanded ? "gap-5 px-5" : "gap-3 px-4"
          )}
        >
          <div className="flex min-w-0 shrink-0 items-center gap-3 pl-0.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#d5e0ee]">
              <Search className="h-5 w-5 text-kiosk-navy" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="text-[0.95rem] leading-none font-extrabold tracking-[0.04em] text-kiosk-navy uppercase">
                {t(language, "smartSearch")}
              </p>
              <p className="mt-1 text-sm leading-snug whitespace-nowrap text-[#6b7c93]">
                {t(language, "smartSearchHint")}
              </p>
            </div>
          </div>

          <form
            className="relative min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              expand();
              setIsOpen(true);
            }}
          >
            <div className="relative h-14 rounded-full bg-white shadow-[inset_0_1px_2px_rgba(15,35,70,0.04)]">
              {showHint && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-y-0 left-0 right-12 z-0 flex items-center truncate text-sm text-[#9baabf] transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    expanded ? "pl-6" : "pl-4"
                  )}
                >
                  {hint}
                </span>
              )}
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  expand();
                  if (query.trim()) setIsOpen(true);
                }}
                onClick={() => expand()}
                placeholder=""
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                className={cn(
                  "relative z-10 h-full w-full rounded-full border-0 bg-transparent text-sm text-kiosk-navy outline-none focus:ring-2 focus:ring-kiosk-navy/15",
                  "appearance-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
                  "transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  expanded ? "pr-16 pl-6" : "pr-14 pl-4"
                )}
                aria-label={t(language, "smartSearch")}
              />
            </div>
            <button
              type="submit"
              onClick={() => expand()}
              className="absolute top-1/2 right-1.5 z-[3] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-kiosk-navy text-white transition hover:scale-105 active:scale-95"
              aria-label={t(language, "search")}
            >
              <Search className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </form>
        </div>

        {showPanel && (
          <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[min(32rem,55vh)] overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/70">
            {(camiBusy || camiReply?.reply) && (
              <div className="border-b border-slate-100 bg-gradient-to-br from-[#f0f9ff] to-white px-5 py-4">
                <div className="mb-2 flex items-center gap-2">
                  <Image
                    src={CAMI_ICON}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <p className="text-xs font-bold tracking-[0.14em] text-kiosk-navy uppercase">
                    Cami
                  </p>
                  {camiBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                </div>
                {camiBusy && !camiReply?.reply ? (
                  <p className="text-sm text-slate-500">Thinking…</p>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                    {camiReply?.reply}
                  </p>
                )}
                {internalCitations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {internalCitations.map((citation) => (
                      <button
                        key={`${citation.type}-${citation.href}-${citation.title}`}
                        type="button"
                        onClick={() => handleSelect(citation.href)}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-kiosk-navy ring-1 ring-slate-200 transition hover:bg-kiosk-navy hover:text-white"
                      >
                        {citation.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {results.filter((result) => Boolean(normalizeKioskHref(result.href))).length > 0 && (
              <div>
                <p className="px-5 pt-3 pb-1 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                  Related pages
                </p>
                {results
                  .filter((result) => Boolean(normalizeKioskHref(result.href)))
                  .map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => handleSelect(result.href)}
                    className="flex w-full flex-col gap-0.5 border-b border-gray-100 px-5 py-3 text-left transition-colors last:border-0 hover:bg-gray-50"
                  >
                    <span className="text-xs font-medium tracking-wide text-kiosk-green uppercase">
                      {formatSearchType(result.type, language)}
                    </span>
                    <span className="font-semibold text-kiosk-navy">{result.title}</span>
                    <span className="line-clamp-1 text-sm text-gray-500">{result.description}</span>
                    {result.meta && <span className="text-xs text-gray-400">{result.meta}</span>}
                  </button>
                ))}
              </div>
            )}

            {!camiBusy && !camiReply?.reply && results.length === 0 && (
              <div className="px-5 py-4">
                <p className="text-sm text-gray-500">{t(language, "noResults")}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
