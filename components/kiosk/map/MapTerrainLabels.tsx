"use client";

import { memo, type ReactNode } from "react";
import { MAP_NATIVE, TRACED_MUNICIPALITIES } from "@/data/map/traced-paths";
import { MAP_ANNOTATIONS, MAP_MUNICIPALITY_LABELS } from "@/data/map/map-spot-labels";
import type { AnnotationKind } from "@/data/map/map-spot-labels";

export type MapTerrainLabelAnnotation = {
  id: string;
  text: string;
  kind: AnnotationKind | string;
  x: number;
  y: number;
  fontSize?: number | null;
  anchor?: string | null;
  isActive?: boolean;
};

export type MapTerrainMunicipalityLabel = {
  slug: string;
  text: string;
  labelX: number;
  labelY: number;
};

type Props = {
  selectedMunicipalitySlug: string | null;
  nightMode?: boolean;
  /** When set (including []), replaces static MAP_ANNOTATIONS. */
  annotations?: MapTerrainLabelAnnotation[];
  /** When set (including []), replaces static municipality labels. */
  municipalityLabels?: MapTerrainMunicipalityLabel[];
};

function annotationIcon(kind: AnnotationKind, x: number, y: number): ReactNode {
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
        className="map-mountain-peak"
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

/** Static map labels — rendered above watercolor decor so text is never hidden. */
export const MapTerrainLabels = memo(function MapTerrainLabels({
  selectedMunicipalitySlug,
  nightMode = false,
  annotations: annotationsOverride,
  municipalityLabels: municipalityLabelsOverride,
}: Props) {
  const { width: W, height: H } = MAP_NATIVE;

  const annotationItems =
    annotationsOverride ??
    MAP_ANNOTATIONS.map((ann) => ({
      id: ann.id,
      text: ann.text,
      kind: ann.kind,
      x: ann.x,
      y: ann.y,
      fontSize: ann.fontSize ?? null,
      anchor: ann.anchor ?? null,
      isActive: true,
    }));

  const visibleAnnotations = annotationItems.filter((a) => a.isActive !== false);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 z-[6] h-full w-full"
      aria-hidden
    >
      <g id="layer-labels">
        {municipalityLabelsOverride
          ? municipalityLabelsOverride.map((m) => {
              const lx = (m.labelX / 100) * W;
              const ly = (m.labelY / 100) * H;
              const selected = selectedMunicipalitySlug === m.slug;
              return (
                <g key={m.slug} opacity={selected ? 1 : 0.95}>
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
                    {m.text}
                  </text>
                </g>
              );
            })
          : Object.entries(TRACED_MUNICIPALITIES).map(([slug, m]) => {
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

        {visibleAnnotations.map((ann) => {
          const x = (ann.x / 100) * W;
          const y = (ann.y / 100) * H;
          const kind = ann.kind as AnnotationKind;
          const size = ann.fontSize ?? (kind === "barangay" ? 7.5 : kind === "area" ? 9 : 9.5);
          const anchor = (ann.anchor ?? "middle") as "start" | "middle" | "end";
          const textY =
            kind === "barangay"
              ? y + 8
              : kind === "peak"
                ? y + 14
                : kind === "terminal" || kind === "area"
                  ? y + 2
                  : y + 11;
          return (
            <g key={ann.id} opacity={kind === "barangay" ? 0.88 : 0.95}>
              {annotationIcon(kind, x, y)}
              <text
                x={x}
                y={textY}
                textAnchor={anchor}
                fill={labelFill(kind, nightMode)}
                fontSize={size}
                fontWeight={kind === "barangay" ? 600 : 700}
                style={{
                  fontFamily: "ui-sans-serif, system-ui, sans-serif",
                  paintOrder: "stroke",
                  stroke: nightMode ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.92)",
                  strokeWidth: kind === "barangay" ? 2 : 2.5,
                }}
              >
                {ann.text}
              </text>
            </g>
          );
        })}

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
