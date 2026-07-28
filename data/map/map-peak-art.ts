import { MAP_NATIVE } from "@/data/map/traced-paths";

/** Default illustrated volcano peaks (native SVG coords). */
export type MapPeakArtDef = {
  id: string;
  /** Annotation slug when the peak has a terrain label */
  annotationSlug?: string;
  attractionIds: string[];
  cx: number;
  cy: number;
  scale: number;
  smoking?: boolean;
  delayClass?: string;
};

export const MAP_PEAK_ART: MapPeakArtDef[] = [
  {
    id: "hibok",
    annotationSlug: "mt-hibok-hibok",
    attractionIds: ["mt-hibok-hibok", "volcano-observatory"],
    cx: 348,
    cy: 267,
    scale: 1.35,
    smoking: true,
  },
  {
    id: "old-volcano",
    annotationSlug: "old-volcano",
    attractionIds: ["walkway-old-volcano"],
    cx: 246,
    cy: 260,
    scale: 1.05,
    delayClass: "map-mountain-peak-delay-1",
  },
  {
    id: "tres-marias",
    annotationSlug: "mt-tres-marias",
    attractionIds: [],
    cx: 410,
    cy: 288,
    scale: 0.95,
    delayClass: "map-mountain-peak-delay-2",
  },
  {
    id: "timpoong",
    annotationSlug: "mt-timpoong",
    attractionIds: [],
    cx: 512,
    cy: 288,
    scale: 1.1,
    delayClass: "map-mountain-peak-delay-3",
  },
  {
    id: "mambajao",
    annotationSlug: "mt-mambajao",
    attractionIds: [],
    cx: 573,
    cy: 245,
    scale: 0.9,
    delayClass: "map-mountain-peak-delay-1",
  },
  {
    id: "minsok",
    annotationSlug: "mt-minsok",
    attractionIds: [],
    cx: 512,
    cy: 360,
    scale: 0.75,
    delayClass: "map-mountain-peak-delay-2",
  },
  {
    id: "uhay",
    annotationSlug: "mt-uhay",
    attractionIds: [],
    cx: 614,
    cy: 360,
    scale: 0.7,
    delayClass: "map-mountain-peak-delay-3",
  },
  {
    id: "guinsiliban",
    annotationSlug: "guinsiliban-peak",
    attractionIds: [],
    cx: 655,
    cy: 533,
    scale: 0.65,
    delayClass: "map-mountain-peak-delay-1",
  },
];

export type PeakPositionOverride = {
  /** MAP_PEAK_ART id or annotation slug */
  id: string;
  /** Map percent 0–100 */
  x: number;
  y: number;
  scale?: number;
};

/** Merge DB/admin peak label positions into illustrated peak art.
 * When `overrides` is provided (including []), only peaks present in overrides are shown —
 * so deleting/deactivating a volcano removes its mountain from the kiosk map.
 * When `overrides` is null/undefined, fall back to the hardcoded catalog (offline/no DB).
 */
export function resolvePeakArt(
  overrides?: PeakPositionOverride[] | null
): MapPeakArtDef[] {
  if (overrides == null) return MAP_PEAK_ART;
  if (overrides.length === 0) return [];

  const { width: W, height: H } = MAP_NATIVE;
  const byId = new Map(overrides.map((o) => [o.id, o]));

  return MAP_PEAK_ART.flatMap((peak) => {
    const match =
      byId.get(peak.id) ??
      (peak.annotationSlug ? byId.get(peak.annotationSlug) : undefined) ??
      peak.attractionIds.map((id) => byId.get(id)).find(Boolean);

    if (!match) return [];
    return [
      {
        ...peak,
        cx: (match.x / 100) * W,
        cy: (match.y / 100) * H,
        scale: match.scale ?? peak.scale,
      },
    ];
  });
}
