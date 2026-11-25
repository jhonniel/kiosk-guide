"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ATTRACTION_CATEGORIES } from "@/features/map/categories";
import type { AttractionCategory, MapEngineCategory } from "@/features/map/types";
import type { Language } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

type Props = {
  language: Language;
  active: AttractionCategory[];
  available: Set<AttractionCategory>;
  onToggle: (category: AttractionCategory) => void;
  onClear: () => void;
  allLabel: string;
  /** DB categories when available; falls back to hardcoded PRIMARY list. */
  categories?: MapEngineCategory[];
};

export function MapFilters({
  language,
  active,
  available,
  onToggle,
  onClear,
  allLabel,
  categories,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollFades = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollFades();
    el.addEventListener("scroll", updateScrollFades, { passive: true });
    const resize = new ResizeObserver(updateScrollFades);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollFades);
      resize.disconnect();
    };
  }, [updateScrollFades, categories, language]);

  const chips =
    categories && categories.length > 0
      ? categories
          .filter((c) => c.showInFilter)
          .map((c) => ({
            id: c.slug as AttractionCategory,
            labelEn: c.nameEn,
            labelFil: c.nameFil,
            labelBis: c.nameBis || c.nameFil,
            color: c.color,
          }))
      : ATTRACTION_CATEGORIES.filter((c) => c.filterable).map((c) => ({
          id: c.id,
          labelEn: c.labelEn,
          labelFil: c.labelFil,
          labelBis: c.labelBis,
          color: c.color,
        }));

  return (
    <div className="pointer-events-auto relative max-w-[min(100%,42rem)]">
      <div
        ref={scrollerRef}
        className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ring-1",
            active.length === 0
              ? "bg-kiosk-navy text-white ring-kiosk-navy"
              : "bg-white/90 text-kiosk-navy ring-slate-200"
          )}
        >
          {allLabel}
        </button>
        {chips.map((c) => {
          const empty = !available.has(c.id);
          const on = active.includes(c.id);
          const label =
            language === "fil" ? c.labelFil : language === "bis" ? c.labelBis : c.labelEn;
          return (
            <button
              key={c.id}
              type="button"
              disabled={empty}
              onClick={() => onToggle(c.id)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ring-1 transition",
                empty && "cursor-not-allowed opacity-35",
                on ? "text-white ring-transparent" : "bg-white/90 text-kiosk-navy ring-slate-200"
              )}
              style={on ? { backgroundColor: c.color } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-sky-200/95 via-sky-200/55 to-transparent transition-opacity duration-200",
          canScrollLeft ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-sky-200/95 via-sky-200/55 to-transparent transition-opacity duration-200",
          canScrollRight ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
