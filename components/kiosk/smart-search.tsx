"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { useOffline } from "@/components/providers/offline-provider";
import { searchAllOffline } from "@/features/offline/client-services";
import { formatSearchType } from "@/features/search/kiosk-catalog";
import { t, SMART_SEARCH_EXAMPLES } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import { loadCitizensCharterOfflineData } from "@/lib/offline/idb";
import type { CitizensCharterOfflineBundle } from "@/features/offline/types";
import type { CharterEditionView } from "@/features/citizens-charter/types";
import type { SearchResult } from "@/features/search/search-service";

const TYPE_MS = 55;
const ERASE_MS = 32;
const HOLD_MS = 1600;
const GAP_MS = 400;

type TypewriterPhase = "typing" | "holding" | "erasing" | "gap";

export function SmartSearch() {
  const { language } = useKiosk();
  const { offlineData } = useOffline();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [charterEdition, setCharterEdition] = useState<CharterEditionView | null>(null);
  const [placeholder, setPlaceholder] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const exampleIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const phaseRef = useRef<TypewriterPhase>("typing");

  const examples = SMART_SEARCH_EXAMPLES[language] ?? SMART_SEARCH_EXAMPLES.en;

  useEffect(() => {
    exampleIndexRef.current = 0;
    charIndexRef.current = 0;
    phaseRef.current = "typing";
    setPlaceholder("");
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
        const res = await fetch("/api/kiosk/citizens-charter", { cache: "force-cache" });
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
    if (query.trim()) {
      setPlaceholder("");
      return;
    }
    if (!expanded) {
      setPlaceholder(examples[0] ?? "");
      return;
    }

    let alive = true;
    let timeoutId = 0;

    const tick = () => {
      if (!alive) return;
      if (typeof document !== "undefined" && document.hidden) {
        timeoutId = window.setTimeout(tick, 1000);
        return;
      }

      const fullText = examples[exampleIndexRef.current % examples.length] ?? "";
      const phase = phaseRef.current;

      if (phase === "typing") {
        charIndexRef.current = Math.min(fullText.length, charIndexRef.current + 1);
        setPlaceholder(fullText.slice(0, charIndexRef.current));
        if (charIndexRef.current >= fullText.length) {
          phaseRef.current = "holding";
          timeoutId = window.setTimeout(tick, HOLD_MS);
          return;
        }
        timeoutId = window.setTimeout(tick, TYPE_MS);
        return;
      }

      if (phase === "holding") {
        phaseRef.current = "erasing";
        timeoutId = window.setTimeout(tick, ERASE_MS);
        return;
      }

      if (phase === "erasing") {
        charIndexRef.current = Math.max(0, charIndexRef.current - 1);
        setPlaceholder(fullText.slice(0, charIndexRef.current));
        if (charIndexRef.current <= 0) {
          phaseRef.current = "gap";
          timeoutId = window.setTimeout(tick, GAP_MS);
          return;
        }
        timeoutId = window.setTimeout(tick, ERASE_MS);
        return;
      }

      // gap → next example
      exampleIndexRef.current = (exampleIndexRef.current + 1) % examples.length;
      charIndexRef.current = 0;
      phaseRef.current = "typing";
      timeoutId = window.setTimeout(tick, TYPE_MS);
    };

    timeoutId = window.setTimeout(tick, TYPE_MS);

    return () => {
      alive = false;
      window.clearTimeout(timeoutId);
    };
  }, [query, examples, language, expanded]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (offlineData) {
        setResults(searchAllOffline(query, language, offlineData, charterEdition));
        setIsOpen(true);
        return;
      }

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&lang=${language}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setIsOpen(true);
      } catch {
        setResults([]);
        setIsOpen(true);
      }
    }, 200);

    return () => clearTimeout(timer);
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
    setIsOpen(false);
    setExpanded(false);
    setQuery("");
    router.push(href);
  }

  function expand() {
    setExpanded(true);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  return (
    <div className="flex justify-center">
      <div
        ref={containerRef}
        className={cn(
          "relative w-full transition-[max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          expanded ? "max-w-full" : "max-w-[34rem]"
        )}
      >
        <div
          className={cn(
            "flex items-center rounded-[28px] bg-[#e8eef6] shadow-[0_8px_24px_rgba(15,35,70,0.06)]",
            "transition-[gap,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            expanded ? "gap-5 px-5 py-4" : "gap-3 px-4 py-3"
          )}
        >
          <div className="flex min-w-0 shrink-0 items-center gap-3 pl-0.5">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-[#d5e0ee] transition-all duration-500",
                expanded ? "h-12 w-12" : "h-11 w-11"
              )}
            >
              <Search className="h-5 w-5 text-kiosk-navy" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] leading-none font-extrabold tracking-[0.04em] text-kiosk-navy uppercase">
                {t(language, "smartSearch")}
              </p>
              <p
                className={cn(
                  "text-[13px] leading-snug text-[#6b7c93] transition-all duration-500",
                  expanded ? "mt-1.5 line-clamp-none" : "mt-1 line-clamp-1 max-w-[9.5rem]"
                )}
              >
                {t(language, "smartSearchHint")}
              </p>
            </div>
          </div>

          <form
            className="relative min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (results[0]) handleSelect(results[0].href);
            }}
          >
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
              placeholder={placeholder}
              className={cn(
                "w-full rounded-full border-0 bg-white text-kiosk-navy shadow-[inset_0_1px_2px_rgba(15,35,70,0.04)] outline-none placeholder:text-[#9baabf] focus:ring-2 focus:ring-kiosk-navy/15",
                "transition-[height,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                expanded ? "h-14 pr-16 pl-6 text-[15px]" : "h-12 pr-14 pl-4 text-[13px]"
              )}
              aria-label={t(language, "smartSearch")}
            />
            <button
              type="submit"
              onClick={() => expand()}
              className={cn(
                "absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center justify-center rounded-full bg-kiosk-navy text-white transition-all duration-300 hover:scale-105 active:scale-95",
                expanded ? "right-2 h-10 w-10" : "h-9 w-9"
              )}
              aria-label={t(language, "search")}
            >
              <Search className={cn(expanded ? "h-4 w-4" : "h-3.5 w-3.5")} strokeWidth={2.5} />
            </button>
          </form>
        </div>

        {expanded && isOpen && results.length > 0 && (
          <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[min(28rem,50vh)] overflow-y-auto rounded-2xl bg-white shadow-xl">
            {results.map((result) => (
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

        {expanded && isOpen && query && results.length === 0 && (
          <div className="absolute top-full right-0 left-0 z-50 mt-2 rounded-2xl bg-white px-5 py-4 shadow-xl">
            <p className="text-sm text-gray-500">{t(language, "noResults")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
