"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { Attraction } from "@/features/map/types";
import { categoryMeta } from "@/features/map/categories";
import { cn } from "@/lib/utils";

type Props = {
  attractions: Attraction[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

export const SVGOverlay = memo(function SVGOverlay({
  attractions,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
}: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
    >
      {attractions.map((a) => {
        const meta = categoryMeta(a.category);
        const active = selectedId === a.id || hoveredId === a.id;
        const d = a.region ?? `M ${a.x - 2.5} ${a.y} a 2.5 2 0 1 0 5 0 a 2.5 2 0 1 0 -5 0`;
        return (
          <path
            key={a.id}
            d={d}
            fill={active ? `${meta?.color ?? "#0f766e"}55` : `${meta?.color ?? "#0f766e"}22`}
            stroke={meta?.color ?? "#0f766e"}
            strokeWidth={active ? 0.45 : 0.22}
            className="cursor-pointer transition-[fill,stroke-width] duration-200"
            style={{ filter: active ? `drop-shadow(0 0 6px ${meta?.color ?? "#0f766e"})` : undefined }}
            onMouseEnter={() => onHover(a.id)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(a.id);
            }}
          />
        );
      })}
    </svg>
  );
});

type MarkerProps = {
  attraction: Attraction;
  selected: boolean;
  hovered: boolean;
  label: string;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

export const MapMarkerPin = memo(function MapMarkerPin({
  attraction,
  selected,
  hovered,
  label,
  onHover,
  onSelect,
}: MarkerProps) {
  const meta = categoryMeta(attraction.category);
  const color = meta?.color ?? "#0f766e";

  return (
    <button
      type="button"
      data-map-marker
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center",
        "touch-manipulation outline-none"
      )}
      style={{ left: `${attraction.x}%`, top: `${attraction.y}%` }}
      onMouseEnter={() => onHover(attraction.id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(attraction.id);
      }}
    >
      {(hovered || selected) && (
        <span className="mb-1 max-w-[9rem] truncate rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
          {label}
        </span>
      )}
      <motion.span
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white shadow-lg",
          selected && "map-marker-pulse"
        )}
        style={{ backgroundColor: color }}
        animate={{ scale: selected ? 1.2 : hovered ? 1.12 : 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 20 }}
      >
        <span className="h-2 w-2 rounded-full bg-white" />
        {selected && <span className="map-ripple absolute inset-0 rounded-full" />}
      </motion.span>
    </button>
  );
});
