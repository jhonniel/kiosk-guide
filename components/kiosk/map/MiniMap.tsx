"use client";

import {
  MAP_NATIVE,
  TRACED_MAIN_ISLAND,
  TRACED_MANTIGUE,
  TRACED_ROADS,
  TRACED_WHITE_ISLAND,
} from "@/data/map/traced-paths";

type Props = {
  center: { x: number; y: number };
  scale: number;
  onJump: (x: number, y: number) => void;
};

/** Vector minimap — no bitmap. */
export function MiniMap({ onJump }: Props) {
  const { width: W, height: H } = MAP_NATIVE;

  return (
    <button
      type="button"
      className="pointer-events-auto relative h-24 w-36 overflow-hidden rounded-xl border border-white/60 bg-[#5eb0cc] shadow-lg"
      aria-label="Minimap"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onJump(
          ((e.clientX - rect.left) / rect.width) * 100,
          ((e.clientY - rect.top) / rect.height) * 100
        );
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
        <rect width={W} height={H} fill="#5eb0cc" />
        {TRACED_MAIN_ISLAND ? (
          <path d={TRACED_MAIN_ISLAND} fill="#7cbc6e" stroke="#e8c56a" strokeWidth={5} />
        ) : null}
        {TRACED_WHITE_ISLAND.map((d, i) => (
          <path key={`wi-${i}`} d={d} fill="#f8f3e6" />
        ))}
        {TRACED_MANTIGUE.map((d, i) => (
          <path key={`mi-${i}`} d={d} fill="#6faf6a" />
        ))}
        {TRACED_ROADS.slice(0, 10).map((d, i) => (
          <path key={`r-${i}`} d={d} fill="none" stroke="#f0b429" strokeWidth={3.5} />
        ))}
      </svg>
    </button>
  );
}
