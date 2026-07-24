"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { Attraction, AttractionCategory } from "@/features/map/types";
import { MAP_SPOT_LABELS } from "@/data/map/map-spot-labels";
import { cn } from "@/lib/utils";
import { MAP_NATIVE } from "@/data/map/traced-paths";

type ObjectProps = {
  attraction: Attraction;
  selected: boolean;
  hovered: boolean;
  label: string;
  labelVisible: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

/**
 * Markers styled like the Camiguin tourism map legend:
 * orange tourist dots, green volcano triangles, port ships.
 */
function MapSpotIcon({
  category,
  active,
}: {
  category: AttractionCategory;
  active: boolean;
}) {
  const size = active ? 26 : 20;

  if (category === "volcano") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <path d="M12 3 L22 21 H2 Z" fill="#65a30d" stroke="#fff" strokeWidth="1.5" />
      </svg>
    );
  }

  if (category === "port") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#1e293b" stroke="#fff" strokeWidth="1.5" />
        <path d="M5 14 H19 L15 8 H9 Z" fill="#f8fafc" />
      </svg>
    );
  }

  // Default = tourism map "Tourist Attraction" orange circle
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#f97316" stroke="#fff" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" fill="#fff7ed" />
      <circle cx="12" cy="12" r="2.2" fill="#ea580c" />
    </svg>
  );
}

function SpotLabel({
  text,
  active,
  side,
}: {
  text: string;
  active: boolean;
  side: "bottom" | "top" | "left" | "right";
}) {
  const sideClass =
    side === "top"
      ? "order-first mb-0.5"
      : side === "left"
        ? "absolute right-full top-1/2 mr-1.5 -translate-y-1/2 text-right"
        : side === "right"
          ? "absolute left-full top-1/2 ml-1.5 -translate-y-1/2 text-left"
          : "mt-0.5";

  return (
    <span
      className={cn(
        "map-spot-label pointer-events-none max-w-[7.5rem] leading-tight",
        sideClass,
        active && "map-spot-label-active"
      )}
    >
      {text}
    </span>
  );
}

export const AttractionMapObject = memo(function AttractionMapObject({
  attraction,
  selected,
  hovered,
  label,
  labelVisible,
  onHover,
  onSelect,
}: ObjectProps) {
  const active = selected || hovered;
  const spot = MAP_SPOT_LABELS[attraction.id];
  const displayLabel = spot?.text ?? label;
  const side = spot?.side ?? "bottom";
  const dx = spot?.dx ?? 0;
  const dy = spot?.dy ?? 0;

  return (
    <button
      type="button"
      data-map-attraction={attraction.id}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "absolute z-10 flex flex-col items-center",
        "touch-manipulation cursor-pointer outline-none"
      )}
      style={{
        left: `${attraction.x}%`,
        top: `${attraction.y}%`,
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
      }}
      onMouseEnter={() => onHover(attraction.id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(attraction.id);
      }}
    >
      <motion.span
        className={cn("relative drop-shadow-md", selected && "map-marker-pulse")}
        animate={{ scale: selected ? 1.2 : hovered ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        style={{
          filter: active ? "drop-shadow(0 0 8px rgba(249,115,22,0.75))" : undefined,
        }}
      >
        <MapSpotIcon category={attraction.category} active={active} />
        {selected && <span className="map-ripple absolute inset-0 rounded-full" />}
      </motion.span>
      {labelVisible && <SpotLabel text={displayLabel} active={active} side={side} />}
    </button>
  );
});

type OverlayProps = {
  attractions: Attraction[];
  selectedId: string | null;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

export const AttractionHitRegions = memo(function AttractionHitRegions({
  attractions,
  selectedId,
  hoveredId,
  onHover,
  onSelect,
}: OverlayProps) {
  const { width: W, height: H } = MAP_NATIVE;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 z-[4] h-full w-full"
    >
      {attractions.map((a) => {
        const active = selectedId === a.id || hoveredId === a.id;
        return (
          <circle
            key={a.id}
            cx={(a.x / 100) * W}
            cy={(a.y / 100) * H}
            r={active ? 20 : 14}
            fill="transparent"
            className="cursor-pointer"
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

export function renderAttractionObject(_id: string, props: ObjectProps) {
  return <AttractionMapObject key={props.attraction.id} {...props} />;
}
