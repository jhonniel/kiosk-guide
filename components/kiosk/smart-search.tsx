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
      <div className="flex items-center gap-4 rounded-2xl bg-kiosk-search px-6 py-5 shadow-sm">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-kiosk-navy">
          <Search className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tracking-wide text-kiosk-navy">{t(language, "smartSearch")}</p>
          <p className="text-xs text-gray-600">{t(language, "smartSearchHint")}</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(language, "smartSearchPlaceholder")}
              className="w-full rounded-full border-0 bg-white px-5 py-3 text-sm text-gray-800 shadow-inner outline-none ring-kiosk-green focus:ring-2"
              aria-label={t(language, "smartSearch")}
            />
            <button
              type="button"
              onClick={() => results[0] && handleSelect(results[0].href)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-kiosk-navy text-white transition-transform hover:scale-105 active:scale-95"
              aria-label={t(language, "search")}
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl bg-white shadow-xl">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              type="button"
              onClick={() => handleSelect(result.href)}
              className="flex w-full flex-col gap-0.5 border-b border-gray-100 px-5 py-3 text-left transition-colors last:border-0 hover:bg-gray-50"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-kiosk-green">{result.type}</span>
              <span className="font-semibold text-kiosk-navy">{result.title}</span>
              <span className="text-sm text-gray-500 line-clamp-1">{result.description}</span>
              {result.meta && <span className="text-xs text-gray-400">{result.meta}</span>}
            </button>
          ))}
        </div>
      )}

      {isOpen && query && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl bg-white px-5 py-4 shadow-xl">
          <p className="text-sm text-gray-500">{t(language, "noResults")}</p>
        </div>
      )}
    </div>
  );
}
