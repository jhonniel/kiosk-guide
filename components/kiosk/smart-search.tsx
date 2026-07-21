"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { useOffline } from "@/components/providers/offline-provider";
import { searchAllOffline } from "@/features/offline/client-services";
import { t } from "@/lib/i18n/translations";
import type { SearchResult } from "@/features/search/search-service";

export function SmartSearch() {
  const { language } = useKiosk();
  const { offlineData } = useOffline();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (offlineData) {
        setResults(searchAllOffline(query, language, offlineData));
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
  }, [query, language, offlineData]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(href: string) {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-5 rounded-[28px] bg-[#e8eef6] px-5 py-4 shadow-[0_8px_24px_rgba(15,35,70,0.06)]">
        <div className="flex min-w-0 shrink-0 items-center gap-3.5 pl-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d5e0ee]">
            <Search className="h-5 w-5 text-kiosk-navy" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] leading-none font-extrabold tracking-[0.04em] text-kiosk-navy uppercase">
              {t(language, "smartSearch")}
            </p>
            <p className="mt-1.5 text-[13px] leading-snug text-[#6b7c93]">
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
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            placeholder={t(language, "smartSearchPlaceholder")}
            className="h-14 w-full rounded-full border-0 bg-white pr-16 pl-6 text-[15px] text-kiosk-navy shadow-[inset_0_1px_2px_rgba(15,35,70,0.04)] outline-none placeholder:text-[#9baabf] focus:ring-2 focus:ring-kiosk-navy/15"
            aria-label={t(language, "smartSearch")}
          />
          <button
            type="submit"
            className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-kiosk-navy text-white transition-transform hover:scale-105 active:scale-95"
            aria-label={t(language, "search")}
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </form>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl bg-white shadow-xl">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              onClick={() => handleSelect(result.href)}
              className="flex w-full flex-col gap-0.5 border-b border-gray-100 px-5 py-3 text-left transition-colors last:border-0 hover:bg-gray-50"
            >
              <span className="text-xs font-medium tracking-wide text-kiosk-green uppercase">{result.type}</span>
              <span className="font-semibold text-kiosk-navy">{result.title}</span>
              <span className="line-clamp-1 text-sm text-gray-500">{result.description}</span>
              {result.meta && <span className="text-xs text-gray-400">{result.meta}</span>}
            </button>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 rounded-2xl bg-white px-5 py-4 shadow-xl">
          <p className="text-sm text-gray-500">{t(language, "noResults")}</p>
        </div>
      )}
    </div>
  );
}
