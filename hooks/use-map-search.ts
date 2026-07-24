"use client";

import { useCallback, useMemo, useState } from "react";
import type { Attraction, AttractionCategory } from "@/features/map/types";

const RECENT_KEY = "camiguin-map-recent-searches";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function useMapSearch(attractions: Attraction[]) {
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<AttractionCategory[]>([]);
  const [recent, setRecent] = useState<string[]>(() => loadRecent());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attractions.filter((a) => {
      if (activeCategories.length && !activeCategories.includes(a.category)) return false;
      if (!q) return true;
      const hay = `${a.name.en} ${a.name.fil} ${a.name.bis} ${a.description.en} ${a.category}`;
      return hay.toLowerCase().includes(q);
    });
  }, [attractions, query, activeCategories]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return attractions.slice(0, 6);
    return attractions
      .filter((a) => `${a.name.en} ${a.name.fil} ${a.name.bis}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [attractions, query]);

  const pushRecent = useCallback((label: string) => {
    setRecent((prev) => {
      const next = [label, ...prev.filter((item) => item !== label)].slice(0, 8);
      try {
        sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore quota
      }
      return next;
    });
  }, []);

  const toggleCategory = useCallback((category: AttractionCategory) => {
    setActiveCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }, []);

  const clearCategories = useCallback(() => setActiveCategories([]), []);

  return {
    query,
    setQuery,
    filtered,
    suggestions,
    recent,
    pushRecent,
    activeCategories,
    toggleCategory,
    clearCategories,
  };
}
