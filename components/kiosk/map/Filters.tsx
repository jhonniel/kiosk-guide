"use client";

import { ATTRACTION_CATEGORIES } from "@/features/map/categories";
import type { AttractionCategory } from "@/features/map/types";
import type { Language } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

/** Primary tourism filters — keep chrome tight. */
const PRIMARY: AttractionCategory[] = [
  "beach",
  "falls",
  "volcano",
  "hot_spring",
  "cold_spring",
  "marine",
  "port",
  "church",
  "landmark",
];

type Props = {
  language: Language;
  active: AttractionCategory[];
  available: Set<AttractionCategory>;
  onToggle: (category: AttractionCategory) => void;
  onClear: () => void;
  allLabel: string;
};

export function MapFilters({ language, active, available, onToggle, onClear, allLabel }: Props) {
  const chips = ATTRACTION_CATEGORIES.filter((c) => PRIMARY.includes(c.id));

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
