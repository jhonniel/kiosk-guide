"use client";

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
    <div className="pointer-events-auto flex max-w-[min(100%,42rem)] gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
  );
}
