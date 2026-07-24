import type { MapRoute } from "./types";

function t(en: string, fil = en, bis = en) {
  return { en, fil, bis };
}

/** Predefined scenic corridors (not full pathfinding). */
export const CAMIGUIN_ROUTES: MapRoute[] = [
  {
    id: "road-mambajao-katibawasan",
    fromId: "airport",
    toId: "katibawasan-falls",
    kind: "road",
    points: [
      { x: 64, y: 22 },
      { x: 58, y: 24 },
      { x: 52, y: 28 },
      { x: 47, y: 34 },
    ],
    travelTime: t("~25 min drive", "~25 min biyahe", "~25 min biyahe"),
  },
  {
    id: "road-capitol-ardent",
    fromId: "balbagon-port",
    toId: "ardent-hot-spring",
    kind: "road",
    points: [
      { x: 56, y: 12 },
      { x: 50, y: 16 },
      { x: 44, y: 20 },
      { x: 40, y: 24 },
    ],
    travelTime: t("~20 min drive", "~20 min biyahe", "~20 min biyahe"),
  },
  {
    id: "road-sunken-loop",
    fromId: "sunken-cemetery",
    toId: "old-church-ruins",
    kind: "road",
    points: [
      { x: 13, y: 28 },
      { x: 14, y: 31 },
      { x: 16, y: 34 },
    ],
    travelTime: t("~5–10 min", "~5–10 min", "~5–10 min"),
  },
  {
    id: "road-south-springs",
    fromId: "sto-nino-cold-spring",
    toId: "macau-springs",
    kind: "road",
    points: [
      { x: 42, y: 64 },
      { x: 45, y: 67 },
      { x: 48, y: 70 },
    ],
    travelTime: t("~15 min", "~15 min", "~15 min"),
  },
  {
    id: "road-to-benoni",
    fromId: "katibawasan-falls",
    toId: "benoni-port",
    kind: "road",
    points: [
      { x: 47, y: 34 },
      { x: 55, y: 38 },
      { x: 65, y: 44 },
      { x: 74, y: 48 },
    ],
    travelTime: t("~35 min drive", "~35 min biyahe", "~35 min biyahe"),
  },
  {
    id: "boat-yumbing-white-island",
    fromId: "balbagon-port",
    toId: "white-island",
    kind: "boat",
    points: [
      { x: 56, y: 12 },
      { x: 40, y: 10 },
      { x: 28, y: 9 },
      { x: 18, y: 10 },
    ],
    travelTime: t("~25–40 min by boat", "~25–40 min sakay bangka", "~25–40 min sakay bangka"),
  },
  {
    id: "boat-benoni-mantigue",
    fromId: "benoni-port",
    toId: "mantigue-island",
    kind: "boat",
    points: [
      { x: 74, y: 48 },
      { x: 78, y: 49 },
      { x: 82, y: 50 },
      { x: 86, y: 51 },
    ],
    travelTime: t("~20–30 min by boat", "~20–30 min sakay bangka", "~20–30 min sakay bangka"),
  },
];

export function findRoute(fromId: string, toId: string) {
  return (
    CAMIGUIN_ROUTES.find((r) => r.fromId === fromId && r.toId === toId) ??
    CAMIGUIN_ROUTES.find((r) => r.fromId === toId && r.toId === fromId) ??
    null
  );
}

/** Build a straight fallback path between two attractions when no corridor exists. */
export function buildStraightRoute(
  fromId: string,
  toId: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
  kind: "road" | "boat" = "road"
): MapRoute {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 2 };
  return {
    id: `generated-${fromId}-${toId}`,
    fromId,
    toId,
    kind,
    points: [from, mid, to],
    travelTime: {
      en: "Estimate varies",
      fil: "Tinatayang oras ay nag-iiba",
      bis: "Banabana nga oras naglainlain",
    },
  };
}
