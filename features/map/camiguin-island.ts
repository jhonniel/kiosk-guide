/** Geographic helpers for Camiguin (vector map engine — no bitmap base). */

export {
  CAMIGUIN_GEO_BOUNDS,
  mapPercentToLatLng,
  MAP_VIEWBOX,
} from "@/data/map/geometry";

/** @deprecated Legacy illustrated PNG — not used by the vector map engine at `/map`. */
export const CAMIGUIN_ISLAND_MAP_SRC = "/images/camiguin-tourist-map.png";

export const CAMIGUIN_LANDMARK_COORDS: Record<string, { x: number; y: number }> = {
  "white island": { x: 18, y: 10 },
  katibawasan: { x: 47, y: 34 },
  "sunken cemetery": { x: 13, y: 28 },
  "ardent hot spring": { x: 40, y: 24 },
  "mount hibok": { x: 34, y: 37 },
  "mount hibok-hibok": { x: 34, y: 37 },
  tuasan: { x: 38, y: 51 },
  mantigue: { x: 86, y: 51 },
  "sto. niño": { x: 42, y: 64 },
};

export const CAMIGUIN_MUNICIPALITY_COORDS: Record<string, { x: number; y: number }> = {
  mambajao: { x: 54, y: 17 },
  mahinog: { x: 69, y: 52 },
  guinsiliban: { x: 70, y: 80 },
  sagay: { x: 52, y: 78 },
  catarman: { x: 40, y: 73 },
};
