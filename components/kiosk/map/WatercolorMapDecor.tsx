"use client";

import { memo } from "react";
import {
  MAP_NATIVE,
  TRACED_MANTIGUE,
  TRACED_WHITE_ISLAND,
} from "@/data/map/traced-paths";
import {
  resolvePeakArt,
  type PeakPositionOverride,
} from "@/data/map/map-peak-art";
import { cn } from "@/lib/utils";

type Props = {
  nightMode?: boolean;
  /** Attraction id currently hovered — lights up matching mountain art. */
  hoveredAttractionId?: string | null;
  /** Admin/DB peak positions (percent) — moves painted volcanoes with labels. */
  peakPositions?: PeakPositionOverride[] | null;
};

/** Hand-painted volcano mound — watercolor-style peak illustration. */
function VolcanoPeak({
  cx,
  cy,
  scale = 1,
  smoking = false,
  nightMode,
  delayClass,
  active = false,
}: {
  cx: number;
  cy: number;
  scale?: number;
  smoking?: boolean;
  nightMode: boolean;
  delayClass?: string;
  active?: boolean;
}) {
  const w = 38 * scale;
  const h = 28 * scale;
  const base = cy + h * 0.35;
  return (
    <g
      transform={`translate(${cx}, ${base})`}
      filter="url(#wc-peak-shadow)"
      className={cn(
        "map-mountain-peak",
        delayClass,
        active && "map-mountain-peak-active"
      )}
      style={active ? { transformOrigin: "0px 0px" } : undefined}
    >
      <ellipse
        cx={0}
        cy={h * 0.15}
        rx={w * 0.55}
        ry={h * 0.22}
        fill={nightMode ? "#1a2e22" : "#2d5a38"}
        opacity={active ? 0.5 : 0.35}
      />
      <path
        d={`M ${-w * 0.42} ${h * 0.15} Q ${-w * 0.2} ${-h * 0.55} 0 ${-h * 0.72} Q ${w * 0.2} ${-h * 0.55} ${w * 0.42} ${h * 0.15} Z`}
        fill={nightMode ? "#3d6b4a" : active ? "#6bb35a" : "#5a9a58"}
        stroke={nightMode ? "#6b8a5a" : active ? "#a3e635" : "#7cbc6e"}
        strokeWidth={active ? 1.8 : 1.2}
        filter="url(#wc-peak-paint)"
      />
      <path
        d={`M ${-w * 0.18} ${-h * 0.35} Q 0 ${-h * 0.62} ${w * 0.18} ${-h * 0.35} L ${w * 0.12} ${h * 0.05} Q 0 ${-h * 0.15} ${-w * 0.12} ${h * 0.05} Z`}
        fill={nightMode ? "#4d7a58" : "#8bc47a"}
        opacity={active ? 0.9 : 0.7}
      />
      {(smoking || active) && (
        <g>
          <ellipse
            className="map-mountain-smoke"
            cx={0}
            cy={-h * 0.82}
            rx={w * 0.12}
            ry={h * 0.1}
            fill="#e2e8f0"
            opacity={nightMode ? 0.45 : 0.65}
          />
          <ellipse
            className="map-mountain-smoke map-mountain-smoke-delay"
            cx={w * 0.08}
            cy={-h * 0.95}
            rx={w * 0.09}
            ry={h * 0.08}
            fill="#f1f5f9"
            opacity={nightMode ? 0.35 : 0.5}
          />
          <ellipse
            className="map-mountain-smoke"
            style={{ animationDelay: "-2.8s" }}
            cx={-w * 0.06}
            cy={-h * 1.05}
            rx={w * 0.07}
            ry={h * 0.06}
            fill="#f8fafc"
            opacity={nightMode ? 0.25 : 0.4}
          />
        </g>
      )}
    </g>
  );
}

/** Tiny illustrated pump boat. */
function PumpBoat({
  cx,
  cy,
  flip = false,
  nightMode,
}: {
  cx: number;
  cy: number;
  flip?: boolean;
  nightMode: boolean;
}) {
  return (
    <g
      transform={`translate(${cx}, ${cy}) scale(${flip ? -1 : 1}, 1)`}
      className="map-boat-a"
      opacity={nightMode ? 0.65 : 0.9}
    >
      <path
        d="M -14 2 Q -8 -4 0 -2 Q 8 -4 14 2 L 10 6 Q 0 4 -10 6 Z"
        fill={nightMode ? "#475569" : "#92400e"}
        stroke="#fff"
        strokeWidth={0.8}
      />
      <path d="M 0 -2 L 0 -14" stroke={nightMode ? "#94a3b8" : "#78350f"} strokeWidth={1.2} />
      <path
        d="M 0 -14 L 8 -10 L 0 -6 Z"
        fill={nightMode ? "#cbd5e1" : "#fef3c7"}
        stroke={nightMode ? "#94a3b8" : "#d97706"}
        strokeWidth={0.6}
      />
    </g>
  );
}

/** Reef / sandbar watercolor blob in the ocean. */
function ReefWash({
  cx,
  cy,
  rx,
  ry,
  nightMode,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  nightMode: boolean;
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={nightMode ? "#38bdf8" : "#a5f3fc"}
      opacity={nightMode ? 0.08 : 0.18}
      filter="url(#wc-reef-blur)"
      className="map-reef-pulse"
    />
  );
}

/** Soft glow around small islands — no hard white stroke. */
function IslandFoam({ paths, nightMode }: { paths: readonly string[]; nightMode: boolean }) {
  return (
    <g opacity={nightMode ? 0.2 : 0.35}>
      {paths.map((d, i) => (
        <path
          key={`foam-${i}`}
          d={d}
          fill={nightMode ? "#38bdf8" : "#e0f2fe"}
          opacity={0.25}
          filter="url(#wc-foam-blur)"
          transform={`scale(${1.06 + i * 0.02})`}
          style={{ transformOrigin: "center" }}
        />
      ))}
    </g>
  );
}

/**
 * Extra watercolor illustration layer — peaks, reef washes, boats, foam.
 * Sits above VectorTerrain, below interactive markers.
 */
export const WatercolorMapDecor = memo(function WatercolorMapDecor({
  nightMode = false,
  hoveredAttractionId = null,
  peakPositions = null,
}: Props) {
  const { width: W, height: H } = MAP_NATIVE;
  const peaks = resolvePeakArt(peakPositions);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
      aria-hidden
    >
      <defs>
        <filter id="wc-peak-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx={0} dy={2} stdDeviation={2.5} floodColor="#0f172a" floodOpacity={0.22} />
        </filter>
        <filter id="wc-peak-paint" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={2.5} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="wc-reef-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="wc-foam-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      <g id="wc-reefs">
        <ReefWash cx={184} cy={58} rx={48} ry={22} nightMode={nightMode} />
        <ReefWash cx={220} cy={95} rx={36} ry={18} nightMode={nightMode} />
        <ReefWash cx={740} cy={120} rx={42} ry={20} nightMode={nightMode} />
        <ReefWash cx={830} cy={200} rx={55} ry={28} nightMode={nightMode} />
        <ReefWash cx={880} cy={340} rx={38} ry={22} nightMode={nightMode} />
        <ReefWash cx={120} cy={200} rx={30} ry={16} nightMode={nightMode} />
        <ReefWash cx={160} cy={320} rx={44} ry={24} nightMode={nightMode} />
        <ReefWash cx={900} cy={480} rx={50} ry={26} nightMode={nightMode} />
        <ReefWash cx={480} cy={30} rx={60} ry={18} nightMode={nightMode} />
        <ReefWash cx={620} cy={680} rx={70} ry={20} nightMode={nightMode} />
      </g>

      {/* Illustrated volcanic peaks — ambient breathe + smoke */}
      <g id="wc-peaks">
        {peaks.map((peak) => (
          <VolcanoPeak
            key={peak.id}
            cx={peak.cx}
            cy={peak.cy}
            scale={peak.scale}
            smoking={peak.smoking}
            nightMode={nightMode}
            delayClass={peak.delayClass}
            active={Boolean(
              hoveredAttractionId && peak.attractionIds.includes(hoveredAttractionId)
            )}
          />
        ))}
      </g>

      {/* Satellite island foam */}
      <g id="wc-foam">
        <IslandFoam paths={TRACED_WHITE_ISLAND} nightMode={nightMode} />
        <IslandFoam paths={TRACED_MANTIGUE} nightMode={nightMode} />
      </g>

      {/* Decorative boats near ports */}
      <g id="wc-boats">
        <PumpBoat cx={758} cy={346} nightMode={nightMode} />
        <PumpBoat cx={573} cy={86} flip nightMode={nightMode} />
        <PumpBoat cx={736} cy={582} flip nightMode={nightMode} />
        <PumpBoat cx={200} cy={520} nightMode={nightMode} />
      </g>

      {/* Tiny plane near airport */}
      <g transform="translate(655, 159)" opacity={nightMode ? 0.5 : 0.75}>
        <path
          d="M -10 0 L 10 0 M 0 -3 L 0 3 M -4 -6 L 4 6 M -4 6 L 4 -6"
          stroke={nightMode ? "#e2e8f0" : "#1e293b"}
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <ellipse
          cx={0}
          cy={0}
          rx={12}
          ry={4}
          fill="none"
          stroke={nightMode ? "#94a3b8" : "#475569"}
          strokeWidth={0.8}
        />
      </g>

      {/* Snorkel mask icons near reef spots */}
      {[
        [184, 58],
        [880, 340],
        [830, 200],
      ].map(([x, y], i) => (
        <g key={`mask-${i}`} transform={`translate(${x}, ${y})`} opacity={nightMode ? 0.45 : 0.7}>
          <ellipse cx={0} cy={0} rx={5} ry={4} fill="#ef4444" stroke="#fff" strokeWidth={0.8} />
          <path d="M -5 0 H 5" stroke="#fff" strokeWidth={0.8} />
        </g>
      ))}
    </svg>
  );
});
