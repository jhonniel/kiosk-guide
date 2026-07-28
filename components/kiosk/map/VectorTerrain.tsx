"use client";

import { memo } from "react";
import {
  MAP_NATIVE,
  TRACED_FOREST,
  TRACED_MAIN_ISLAND,
  TRACED_MANTIGUE,
  TRACED_ROADS,
  TRACED_WHITE_ISLAND,
} from "@/data/map/traced-paths";

type Props = {
  /** Kept for callers; municipality focus is shown via labels only. */
  selectedMunicipalitySlug?: string | null;
  routeRoadActive?: boolean;
  nightMode?: boolean;
  language?: "en" | "fil" | "bis";
  /** When true, skip the ocean fill so a full-bleed sea can sit behind the stage. */
  hideOcean?: boolean;
};

/**
 * Pure SVG Camiguin map — geometry traced from the tourism reference artwork.
 * The reference PNG is NEVER rendered; only vector paths are shown.
 */
export const VectorTerrain = memo(function VectorTerrain({
  routeRoadActive = false,
  nightMode = false,
  hideOcean = false,
}: Props) {
  const { width: W, height: H } = MAP_NATIVE;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 z-0 h-full w-full"
      shapeRendering="geometricPrecision"
      role="img"
      aria-label="Camiguin Island interactive map"
    >
      <defs>
        <linearGradient id="ocean-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={nightMode ? "#0a3348" : "#6ec4dc"} />
          <stop offset="25%" stopColor={nightMode ? "#0c4a66" : "#7ec8de"} />
          <stop offset="55%" stopColor={nightMode ? "#0a3d56" : "#5eb0cc"} />
          <stop offset="80%" stopColor={nightMode ? "#082a3a" : "#4a9bbb"} />
          <stop offset="100%" stopColor={nightMode ? "#061e2a" : "#3d8aaa"} />
        </linearGradient>
        <radialGradient id="ocean-glow" cx="75%" cy="15%" r="45%">
          <stop offset="0%" stopColor="#fff" stopOpacity={nightMode ? 0.14 : 0.32} />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ocean-shallow" cx="30%" cy="20%" r="35%">
          <stop offset="0%" stopColor={nightMode ? "#38bdf8" : "#a5f3fc"} stopOpacity={nightMode ? 0.12 : 0.28} />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="land-grad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor={nightMode ? "#5a8a62" : "#b8e08a"} />
          <stop offset="30%" stopColor={nightMode ? "#4d7a58" : "#a8d48a"} />
          <stop offset="55%" stopColor={nightMode ? "#3d6b4a" : "#7cbc6e"} />
          <stop offset="80%" stopColor={nightMode ? "#345a42" : "#6aaf62"} />
          <stop offset="100%" stopColor={nightMode ? "#2f5640" : "#5a9a58"} />
        </linearGradient>
        <linearGradient id="land-wash-a" x1="0%" y1="30%" x2="100%" y2="70%">
          <stop offset="0%" stopColor={nightMode ? "#2a4534" : "#4d7a52"} stopOpacity="0" />
          <stop offset="50%" stopColor={nightMode ? "#2a4534" : "#4d7a52"} stopOpacity="0.22" />
          <stop offset="100%" stopColor={nightMode ? "#2a4534" : "#4d7a52"} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="coast-sand" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={nightMode ? "#6b6a4a" : "#f5e6b8"} stopOpacity="0.65" />
          <stop offset="50%" stopColor={nightMode ? "#6b6a4a" : "#e6d89a"} stopOpacity="0.35" />
          <stop offset="100%" stopColor={nightMode ? "#6b6a4a" : "#e6d89a"} stopOpacity="0" />
        </linearGradient>
        <filter id="watercolor" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves={4} seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="0.6" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale={5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="watercolor-soft" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves={3} seed="13" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={3} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="paper" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={3} seed="2" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0.92  0 0 0 0 0.94  0 0 0 0 0.96  0 0 0 0.1 0"
          />
        </filter>
        <filter id="ocean-texture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={4} seed="5" result="t" />
          <feColorMatrix
            in="t"
            type="matrix"
            values="0 0 0 0 0.15  0 0 0 0 0.45  0 0 0 0 0.65  0 0 0 0.12 0"
          />
        </filter>
        <filter id="land-depth" x="-4%" y="-4%" width="108%" height="108%">
          <feDropShadow dx={0} dy={3} stdDeviation={4} floodColor="#0f172a" floodOpacity={0.32} />
        </filter>
        <filter id="muni-glow" x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx={0} dy={0} stdDeviation={5} floodColor="#0f766e" floodOpacity="0.5" />
        </filter>
        <clipPath id="island-clip">
          {TRACED_MAIN_ISLAND ? <path d={TRACED_MAIN_ISLAND} /> : null}
        </clipPath>
      </defs>

      {/* Layer 1 — Ocean (optional; full-bleed sea can be painted behind the stage) */}
      {!hideOcean ? (
        <g id="layer-ocean">
          <rect width={W} height={H} fill="url(#ocean-grad)" />
          <rect width={W} height={H} fill="url(#ocean-shallow)" className="pointer-events-none" />
          <rect width={W} height={H} fill="url(#ocean-glow)" className="pointer-events-none" />
          <rect width={W} height={H} filter="url(#ocean-texture)" className="pointer-events-none" opacity={nightMode ? 0.35 : 0.55} />
          <rect width={W} height={H} filter="url(#paper)" className="pointer-events-none" opacity={nightMode ? 0.35 : 0.55} />
        </g>
      ) : null}

      {/* Layer 2 — Island (traced coastline) */}
      <g id="layer-island" filter="url(#land-depth)">
        {TRACED_MAIN_ISLAND ? (
          <>
            <path
              d={TRACED_MAIN_ISLAND}
              fill="none"
              stroke={nightMode ? "#b45309" : "#fbbf24"}
              strokeWidth={10}
              strokeLinejoin="round"
              opacity={nightMode ? 0.2 : 0.32}
              filter="url(#watercolor-soft)"
            />
            <path
              d={TRACED_MAIN_ISLAND}
              fill="url(#land-grad)"
              stroke={nightMode ? "#c4a35a" : "#e8c56a"}
              strokeWidth={4.5}
              strokeLinejoin="round"
              filter="url(#watercolor-soft)"
            />
          </>
        ) : null}
        <g clipPath="url(#island-clip)">
          <path d={TRACED_MAIN_ISLAND || ""} fill="url(#coast-sand)" />
          <path d={TRACED_MAIN_ISLAND || ""} fill="url(#land-wash-a)" />
          {TRACED_FOREST.map((d, i) => (
            <path
              key={`f-${i}`}
              d={d}
              fill={
                nightMode
                  ? i % 2 === 0
                    ? "#2a4534"
                    : "#345a42"
                  : i % 2 === 0
                    ? "#4d7a52"
                    : "#5a8f5e"
              }
              opacity={0.32 + (i % 4) * 0.09}
              filter="url(#watercolor)"
            />
          ))}
          <ellipse cx={348} cy={267} rx={95} ry={72} fill={nightMode ? "#1e3328" : "#3d6b48"} opacity={0.28} filter="url(#watercolor-soft)" />
          <ellipse cx={400} cy={290} rx={200} ry={140} fill={nightMode ? "#1e3328" : "#3d6b48"} opacity={0.22} />
          <ellipse cx={512} cy={310} rx={150} ry={105} fill={nightMode ? "#243d30" : "#458552"} opacity={0.2} filter="url(#watercolor-soft)" />
          <ellipse cx={540} cy={370} rx={170} ry={120} fill={nightMode ? "#1e3328" : "#3d6b48"} opacity={0.18} />
          <ellipse cx={280} cy={380} rx={120} ry={90} fill={nightMode ? "#1a2e22" : "#356840"} opacity={0.16} />
          <ellipse cx={620} cy={420} rx={130} ry={95} fill={nightMode ? "#1e3328" : "#3d6b48"} opacity={0.17} />
        </g>
      </g>

      {/* Layer 4 — Primary roads only (Google Maps: coastal loop + cross-island) */}
      <g id="layer-roads" className="pointer-events-none">
        {/* Soft outline like highway casing */}
        {TRACED_ROADS.map((d, i) => (
          <path
            key={`road-case-${i}`}
            d={d}
            fill="none"
            stroke={nightMode ? "#1e293b" : "#fff8e7"}
            strokeWidth={i === 0 ? 5.8 : 4.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
            filter="url(#watercolor-soft)"
          />
        ))}
        {TRACED_ROADS.map((d, i) => {
          const isRing = i === 0;
          return (
            <path
              key={`road-${i}`}
              d={d}
              fill="none"
              stroke={routeRoadActive ? "#f59e0b" : nightMode ? "#d4a84b" : "#eab308"}
              strokeWidth={isRing ? (routeRoadActive ? 3.6 : 3) : routeRoadActive ? 3.2 : 2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={1}
              filter="url(#watercolor-soft)"
              className={routeRoadActive ? "map-road-illuminate" : undefined}
            />
          );
        })}
      </g>

      {/* Layer 5 — Satellite islands */}
      <g id="layer-islands" filter="url(#land-depth)">
        {TRACED_WHITE_ISLAND.map((d, i) => (
          <path
            key={`wi-${i}`}
            d={d}
            fill={nightMode ? "#d4cdb8" : "#f8f3e6"}
            stroke={nightMode ? "#b8ae96" : "#e5d9bc"}
            strokeWidth={2.5}
            filter="url(#watercolor-soft)"
          />
        ))}
        {TRACED_MANTIGUE.map((d, i) => (
          <path
            key={`mi-${i}`}
            d={d}
            fill={nightMode ? "#3f6b48" : "#6faf6a"}
            stroke={nightMode ? "#c4a35a" : "#e8c56a"}
            strokeWidth={3}
            filter="url(#watercolor-soft)"
          />
        ))}
      </g>
    </svg>
  );
});
