"use client";

import { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import type { Attraction } from "@/features/map/types";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  suggestions: Attraction[];
  recent: string[];
  labelOf: (a: Attraction) => string;
  placeholder: string;
  recentLabel: string;
  onPick: (attraction: Attraction) => void;
  onPickRecent: (label: string) => void;
};

/** Search opens only while focused — no permanent suggestion wall. */
export function MapSearch({
  query,
  onQueryChange,
  suggestions,
  recent,
  labelOf,
  placeholder,
  recentLabel,
  onPick,
  onPickRecent,
}: Props) {
  const [focused, setFocused] = useState(false);
  const q = query.trim();
  const showPanel = focused && (q.length > 0 ? suggestions.length > 0 : recent.length > 0);

  return (
    <div className="pointer-events-auto relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-2xl border border-white/50 bg-white/90 px-3 py-2.5 shadow-lg backdrop-blur-xl">
        <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Delay so click on suggestion still registers
            window.setTimeout(() => setFocused(false), 140);
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-kiosk-navy outline-none placeholder:text-slate-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-40 overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-xl backdrop-blur-xl">
          {!q && recent.length > 0 && (
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {recentLabel}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recent.slice(0, 5).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onPickRecent(item)}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-kiosk-navy hover:bg-slate-200"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
          {q.length > 0 && (
            <ul className="max-h-52 overflow-y-auto py-1">
              {suggestions.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onPick(a)}
                    className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-kiosk-navy hover:bg-slate-50"
                  >
                    {labelOf(a)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
