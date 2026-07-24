"use client";

import { memo, type ReactNode } from "react";
import {
  MAP_NATIVE,
  TRACED_FOREST,
  TRACED_MAIN_ISLAND,
  TRACED_MANTIGUE,
  TRACED_MUNICIPALITIES,
  TRACED_ROADS,
  TRACED_WHITE_ISLAND,
} from "@/data/map/traced-paths";
import { MAP_ANNOTATIONS, MAP_MUNICIPALITY_LABELS } from "@/data/map/map-spot-labels";
import type { AnnotationKind } from "@/data/map/map-spot-labels";

type Props = {
  selectedMunicipalitySlug: string | null;
  routeRoadActive?: boolean;
  nightMode?: boolean;
  language?: "en" | "fil" | "bis";
  /** When true, skip the ocean fill so a full-bleed sea can sit behind the stage. */
  hideOcean?: boolean;
};

function annotationIcon(
  kind: AnnotationKind,
  x: number,
  y: number
): ReactNode {
  if (kind === "barangay") {
    return (
      <path
        d={`M ${x} ${y - 5} L ${x + 3.5} ${y - 1} L ${x - 3.5} ${y - 1} Z`}
        fill="#ea580c"
        stroke="#fff"
        strokeWidth={0.8}
      />
    );
  }
  if (kind === "peak") {
    return (
      <path
        d={`M ${x} ${y - 9} L ${x + 5.5} ${y} L ${x - 5.5} ${y} Z`}
        fill="#65a30d"
        stroke="#fff"
        strokeWidth={1}
      />
    );
  }
  if (kind === "port") {
    return (
      <g transform={`translate(${x}, ${y - 4})`}>
        <circle r="5.5" fill="#1e293b" stroke="#fff" strokeWidth="1" />
        <path d="M -3.5 1.5 H 3.5 L 1.5 -2 H -1.5 Z" fill="#f8fafc" />
      </g>
    );
  }
  if (kind === "reef" || kind === "poi") {
    return (
      <g transform={`translate(${x}, ${y - 3})`}>
        <circle r="4.5" fill="#f97316" stroke="#fff" strokeWidth="1.2" />
        <circle r="1.6" fill="#fff7ed" />
      </g>
    );
  }
  return null;
}

function labelFill(kind: AnnotationKind, nightMode: boolean): string {
  if (kind === "barangay") return nightMode ? "#cbd5e1" : "#334155";
  if (kind === "peak") return nightMode ? "#e2e8f0" : "#14532d";
  if (kind === "area") return nightMode ? "#fef3c7" : "#78350f";
  if (kind === "terminal") return nightMode ? "#bae6fd" : "#0c4a6e";
  return nightMode ? "#f8fafc" : "#0f172a";
}

/**
 * Pure SVG Camiguin map — geometry traced from the tourism reference artwork.
 * The reference PNG is NEVER rendered; only vector paths are shown.
 */
export const VectorTerrain = memo(function VectorTerrain({
  selectedMunicipalitySlug,
  routeRoadActive = false,
  nightMode = false,
  language = "en",
  hideOcean = false,
}: Props) {
  const { width: W, height: H } = MAP_NATIVE;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full"
      shapeRendering="geometricPrecision"
      role="img"
      aria-label="Camiguin Island interactive map"
    >
      <defs>
        <linearGradient id="ocean-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={nightMode ? "#0a3348" : "#5eb0cc"} />
          <stop offset="40%" stopColor={nightMode ? "#0c4a66" : "#7ec8de"} />
          <stop offset="100%" stopColor={nightMode ? "#082a3a" : "#4a9bbb"} />
        </linearGradient>
        <radialGradient id="ocean-glow" cx="75%" cy="15%" r="45%">
          <stop offset="0%" stopColor="#fff" stopOpacity={nightMode ? 0.14 : 0.32} />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="land-grad" x1="25%" y1="5%" x2="75%" y2="95%">
          <stop offset="0%" stopColor={nightMode ? "#4d7a58" : "#a8d48a"} />
          <stop offset="45%" stopColor={nightMode ? "#3d6b4a" : "#7cbc6e"} />
          <stop offset="100%" stopColor={nightMode ? "#2f5640" : "#5a9a58"} />
        </linearGradient>
        <linearGradient id="coast-sand" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={nightMode ? "#6b6a4a" : "#e6d89a"} stopOpacity="0.55" />
          <stop offset="100%" stopColor={nightMode ? "#6b6a4a" : "#e6d89a"} stopOpacity="0" />
        </linearGradient>
        <filter id="watercolor" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="paper" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="2" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.92  0 0 0 0 0.95  0 0 0 0.08 0" />
        </filter>
        <filter id="land-depth" x="-3%" y="-3%" width="106%" height="106%">
          <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.28" />
        </filter>
        <filter id="muni-glow" x="-12%" y="-12%" width="124%" height="124%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#0f766e" floodOpacity="0.5" />
        </filter>
        <clipPath id="island-clip">
          {TRACED_MAIN_ISLAND ? <path d={TRACED_MAIN_ISLAND} /> : null}
        </clipPath>
      </defs>

      {/* Layer 1 — Ocean (optional; full-bleed sea can be painted behind the stage) */}
      {!hideOcean ? (
        <g id="layer-ocean">
          <rect width={W} height={H} fill="url(#ocean-grad)" />
          <rect width={W} height={H} fill="url(#ocean-glow)" className="pointer-events-none" />
          <rect width={W} height={H} filter="url(#paper)" className="pointer-events-none" opacity={0.5} />
          <g className="map-wave-layer pointer-events-none" opacity={nightMode ? 0.1 : 0.2}>
            <path d="M -40 170 Q 200 140 420 170 T 900 170 T 1300 170" fill="none" stroke="#fff" strokeWidth="2" />
            <path d="M -40 400 Q 240 365 500 400 T 1100 400" fill="none" stroke="#fff" strokeWidth="1.5" />
            <path d="M -40 580 Q 220 550 480 580 T 1080 580" fill="none" stroke="#fff" strokeWidth="1.3" />
          </g>
        </g>
      ) : null}

      {/* Layer 2 — Island (traced coastline) */}
      <g id="layer-island" filter="url(#land-depth)">
        {TRACED_MAIN_ISLAND ? (
          <path
            d={TRACED_MAIN_ISLAND}
            fill="url(#land-grad)"
            stroke={nightMode ? "#c4a35a" : "#e8c56a"}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        ) : null}
        <g clipPath="url(#island-clip)">
          {/* Soft coastal wash */}
          <path d={TRACED_MAIN_ISLAND || ""} fill="url(#coast-sand)" />
          {/* Forest / mountain interior (traced) */}
          {TRACED_FOREST.map((d, i) => (
            <path
              key={`f-${i}`}
              d={d}
              fill={nightMode ? "#2a4534" : "#4d7a52"}
              opacity={0.35 + (i % 3) * 0.08}
              filter="url(#watercolor)"
            />
          ))}
          {/* Peak shading */}
          <ellipse cx={400} cy={290} rx={200} ry={140} fill={nightMode ? "#1e3328" : "#3d6b48"} opacity={0.22} />
          <ellipse cx={540} cy={370} rx={170} ry={120} fill={nightMode ? "#1e3328" : "#3d6b48"} opacity={0.18} />
        </g>
      </g>

      {/* Layer 3 — Municipalities (subtle selection only) */}
      <g id="layer-municipalities">
        {Object.entries(TRACED_MUNICIPALITIES).map(([slug, m]) => {
          const selected = selectedMunicipalitySlug === slug;
          if (!selected) return null;
          return (
            <path
              key={slug}
              d={m.path}
              fill="#0f766e18"
              stroke="#0f766e"
              strokeWidth={1.75}
              strokeDasharray="6 4"
              className="pointer-events-none"
            />
          );
        })}
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
            strokeWidth={i === 0 ? 5.2 : 4.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
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
              strokeWidth={isRing ? (routeRoadActive ? 3.4 : 2.8) : routeRoadActive ? 3 : 2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={1}
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
            strokeWidth={2}
          />
        ))}
        {TRACED_MANTIGUE.map((d, i) => (
          <path
            key={`mi-${i}`}
            d={d}
            fill={nightMode ? "#3f6b48" : "#6faf6a"}
            stroke={nightMode ? "#c4a35a" : "#e8c56a"}
            strokeWidth={2.5}
          />
        ))}
      </g>

      {/* Layer 6 — All tourism-map labels */}
      <g id="layer-labels" className="pointer-events-none">
        {Object.entries(TRACED_MUNICIPALITIES).map(([slug, m]) => {
          const [lx, ly] = m.label;
          const selected = selectedMunicipalitySlug === slug;
          const text = MAP_MUNICIPALITY_LABELS[slug] ?? slug.toUpperCase();
          return (
            <g key={slug} opacity={selected ? 1 : 0.95}>
              <path
                d={`M ${lx} ${ly - 18} L ${lx + 7} ${ly - 6} L ${lx - 7} ${ly - 6} Z`}
                fill="#eab308"
                stroke="#fff"
                strokeWidth={1.2}
              />
              <text
                x={lx}
                y={ly + 2}
                textAnchor="middle"
                fill={nightMode ? "#f8fafc" : "#1e293b"}
                fontSize={selected ? 14 : 12}
                fontWeight={800}
                letterSpacing="0.06em"
                style={{
                  fontFamily: "ui-sans-serif, system-ui, sans-serif",
                  paintOrder: "stroke",
                  stroke: nightMode ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.95)",
                  strokeWidth: 3,
                }}
              >
                {text}
              </text>
            </g>
          );
        })}

        {MAP_ANNOTATIONS.map((ann) => {
          const x = (ann.x / 100) * W;
          const y = (ann.y / 100) * H;
          const size = ann.fontSize ?? (ann.kind === "barangay" ? 7.5 : ann.kind === "area" ? 9 : 9.5);
          const anchor = ann.anchor ?? "middle";
          const textY =
            ann.kind === "barangay"
              ? y + 8
              : ann.kind === "terminal" || ann.kind === "area"
                ? y + 2
                : y + 11;
          return (
            <g key={ann.id} opacity={ann.kind === "barangay" ? 0.88 : 0.95}>
              {annotationIcon(ann.kind, x, y)}
              <text
                x={x}
                y={textY}
                textAnchor={anchor}
                fill={labelFill(ann.kind, nightMode)}
                fontSize={size}
                fontWeight={ann.kind === "barangay" ? 600 : 700}
                style={{
                  fontFamily: "ui-sans-serif, system-ui, sans-serif",
                  paintOrder: "stroke",
                  stroke: nightMode ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.92)",
                  strokeWidth: ann.kind === "barangay" ? 2 : 2.5,
                }}
              >
                {ann.text}
              </text>
            </g>
          );
        })}

        {/* Branding corner — matches tourism map tagline */}
        <text
          x={W - 28}
          y={H - 36}
          textAnchor="end"
          fill={nightMode ? "#f8fafc" : "#0f172a"}
          fontSize={13}
          fontWeight={800}
          letterSpacing="0.04em"
          style={{
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            paintOrder: "stroke",
            stroke: nightMode ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.85)",
            strokeWidth: 3,
          }}
        >
          Camiguin
        </text>
        <text
          x={W - 28}
          y={H - 20}
          textAnchor="end"
          fill={nightMode ? "#fbbf24" : "#b45309"}
          fontSize={9}
          fontWeight={700}
          letterSpacing="0.16em"
          style={{
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            paintOrder: "stroke",
            stroke: nightMode ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.8)",
            strokeWidth: 2.5,
          }}
        >
          THE ISLAND BORN OF FIRE
        </text>
      </g>
    </svg>
  );
});
