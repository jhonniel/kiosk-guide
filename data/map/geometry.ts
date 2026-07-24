/**
 * Camiguin vector map geometry (viewBox 0 0 100 100).
 * Municipality polygons digitized to the master tourism map (1024×721).
 * Source of truth for seeding MapFeature / MapMunicipality rows.
 */

export const MAP_VIEWBOX = { width: 100, height: 100 } as const;

/** Approximate geographic bounds used to derive lat/lng from map %. */
export const CAMIGUIN_GEO_BOUNDS = {
  minLat: 9.05,
  maxLat: 9.28,
  minLng: 124.65,
  maxLng: 124.82,
} as const;

export function mapPercentToLatLng(mapX: number, mapY: number) {
  const { minLat, maxLat, minLng, maxLng } = CAMIGUIN_GEO_BOUNDS;
  const latitude = maxLat - (mapY / 100) * (maxLat - minLat);
  const longitude = minLng + (mapX / 100) * (maxLng - minLng);
  return { latitude, longitude };
}

export type SeedMapFeature = {
  slug: string;
  kind: string;
  nameEn?: string;
  nameFil?: string;
  nameBis?: string;
  svgPath: string;
  fill?: string;
  stroke?: string;
  zIndex: number;
  animated?: boolean;
  metaJson?: string;
};

export type SeedMunicipality = {
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string;
  description?: string;
  svgPath: string;
  labelX: number;
  labelY: number;
  fillColor: string;
  sortOrder: number;
};

/** Main Camiguin coastline — pear-shaped island oriented with north at top. */
export const ISLAND_COASTLINE =
  "M 52 8 C 62 7.5, 70 10, 74 16 C 78 22, 80 30, 79 40 C 78 50, 76 58, 74 65 C 72 74, 70 82, 64 88 C 58 93, 50 94, 42 92 C 34 90, 26 84, 20 76 C 14 68, 11 58, 10 48 C 9 38, 11 28, 16 20 C 22 12, 34 8.5, 44 8 C 47 7.8, 50 7.9, 52 8 Z";

export const WHITE_ISLAND_PATH =
  "M 14 8 C 16 6.5, 20 6.5, 22 8.5 C 23.5 10, 22 12, 19 12.5 C 16 13, 13.5 11, 14 8 Z";

export const MANTIGUE_PATH =
  "M 84 48 C 87 47, 90 49, 90 52 C 90 55, 87 57, 84 56 C 81 55, 81 50, 84 48 Z";

export const HIBOK_CONTOUR =
  "M 28 30 C 32 26, 40 26, 44 32 C 46 36, 44 42, 38 44 C 32 46, 26 42, 26 36 C 26 33, 27 31, 28 30 Z";

export const FOREST_NORTH =
  "M 36 18 C 44 16, 54 17, 58 22 C 56 26, 48 27, 40 26 C 34 24, 34 20, 36 18 Z";

export const FOREST_CENTRAL =
  "M 40 40 C 48 38, 56 40, 58 46 C 56 50, 48 51, 42 49 C 38 47, 38 42, 40 40 Z";

export const FOREST_SOUTH =
  "M 44 62 C 52 60, 60 63, 62 70 C 58 74, 50 74, 44 71 C 40 68, 40 64, 44 62 Z";

/** Circumferential coastal road (simplified polyline as path). */
export const RING_ROAD =
  "M 54 11 C 64 12, 72 18, 75 28 C 78 40, 76 52, 73 62 C 70 74, 64 84, 54 88 C 44 91, 30 86, 22 76 C 14 64, 12 50, 14 36 C 16 24, 24 14, 36 11 C 42 10, 48 10, 54 11";

export const INLAND_ROAD_NORTH =
  "M 54 14 L 48 20 L 42 26 L 38 32 L 36 38";

export const INLAND_ROAD_EAST =
  "M 58 24 L 62 30 L 66 38 L 70 44 L 74 48";

export const INLAND_ROAD_SOUTH =
  "M 46 36 L 44 46 L 42 56 L 44 64 L 48 70";

export const MAP_FEATURES: SeedMapFeature[] = [
  {
    slug: "ocean-base",
    kind: "ocean",
    nameEn: "Bohol Sea",
    nameFil: "Bohol Sea",
    nameBis: "Bohol Sea",
    svgPath: "M 0 0 H 100 V 100 H 0 Z",
    fill: "#7ec8e3",
    zIndex: 0,
    animated: true,
  },
  {
    slug: "shallow-reef-north",
    kind: "reef",
    nameEn: "Northern shallows",
    svgPath: "M 8 4 C 30 2, 55 3, 72 10 C 60 16, 35 14, 12 12 Z",
    fill: "#a8e0f0",
    zIndex: 1,
    animated: true,
  },
  {
    slug: "shallow-reef-east",
    kind: "reef",
    nameEn: "Eastern shallows",
    svgPath: "M 78 40 C 92 42, 96 55, 90 62 C 84 58, 80 50, 78 40 Z",
    fill: "#9fd9ec",
    zIndex: 1,
  },
  {
    slug: "island-coastline",
    kind: "coastline",
    nameEn: "Camiguin Island",
    nameFil: "Isla ng Camiguin",
    nameBis: "Isla sa Camiguin",
    svgPath: ISLAND_COASTLINE,
    fill: "#d4e8c2",
    stroke: "#6b9e6e",
    zIndex: 10,
  },
  {
    slug: "white-island",
    kind: "island",
    nameEn: "White Island",
    svgPath: WHITE_ISLAND_PATH,
    fill: "#f7f3e8",
    stroke: "#e8d9b0",
    zIndex: 12,
  },
  {
    slug: "mantigue-island",
    kind: "island",
    nameEn: "Mantigue Island",
    svgPath: MANTIGUE_PATH,
    fill: "#cfe8b8",
    stroke: "#6b9e6e",
    zIndex: 12,
  },
  {
    slug: "forest-north",
    kind: "forest",
    nameEn: "Northern forest",
    svgPath: FOREST_NORTH,
    fill: "#8fbf6e",
    zIndex: 20,
    animated: true,
  },
  {
    slug: "forest-central",
    kind: "forest",
    nameEn: "Central forest",
    svgPath: FOREST_CENTRAL,
    fill: "#7aaf5c",
    zIndex: 20,
    animated: true,
  },
  {
    slug: "forest-south",
    kind: "forest",
    nameEn: "Southern forest",
    svgPath: FOREST_SOUTH,
    fill: "#86b865",
    zIndex: 20,
    animated: true,
  },
  {
    slug: "hibok-hibok",
    kind: "mountain",
    nameEn: "Mt. Hibok-Hibok",
    nameFil: "Mt. Hibok-Hibok",
    nameBis: "Mt. Hibok-Hibok",
    svgPath: HIBOK_CONTOUR,
    fill: "#c4b29a",
    stroke: "#8a7358",
    zIndex: 25,
  },
  {
    slug: "ring-road",
    kind: "road",
    nameEn: "Circumferential Road",
    nameFil: "Circumferential Road",
    nameBis: "Circumferential Road",
    svgPath: RING_ROAD,
    stroke: "#f5f0e0",
    fill: "none",
    zIndex: 30,
    metaJson: JSON.stringify({ strokeWidth: 0.55 }),
  },
  {
    slug: "inland-road-north",
    kind: "road",
    nameEn: "Northern inland road",
    svgPath: INLAND_ROAD_NORTH,
    stroke: "#efe6d0",
    fill: "none",
    zIndex: 30,
    metaJson: JSON.stringify({ strokeWidth: 0.35 }),
  },
  {
    slug: "inland-road-east",
    kind: "road",
    nameEn: "Eastern inland road",
    svgPath: INLAND_ROAD_EAST,
    stroke: "#efe6d0",
    fill: "none",
    zIndex: 30,
    metaJson: JSON.stringify({ strokeWidth: 0.35 }),
  },
  {
    slug: "inland-road-south",
    kind: "road",
    nameEn: "Southern inland road",
    svgPath: INLAND_ROAD_SOUTH,
    stroke: "#efe6d0",
    fill: "none",
    zIndex: 30,
    metaJson: JSON.stringify({ strokeWidth: 0.35 }),
  },
];

export const MUNICIPALITIES: SeedMunicipality[] = [
  {
    slug: "mambajao",
    nameEn: "Mambajao",
    nameFil: "Mambajao",
    nameBis: "Mambajao",
    description: "Provincial capital — northern gateway to Camiguin.",
    svgPath: "M 380 55 C 480 40, 620 45, 720 90 C 780 140, 800 210, 760 270 C 700 300, 600 290, 520 270 C 440 250, 380 200, 360 140 C 350 100, 360 70, 380 55 Z",
    labelX: 54.69,
    labelY: 18.03,
    fillColor: "#c8e6d8",
    sortOrder: 1,
  },
  {
    slug: "mahinog",
    nameEn: "Mahinog",
    nameFil: "Mahinog",
    nameBis: "Mahinog",
    description: "Eastern municipality — Benoni Port and Mantigue access.",
    svgPath: "M 620 280 C 720 270, 800 320, 810 400 C 800 470, 740 510, 660 500 C 600 470, 580 380, 600 320 C 610 295, 615 285, 620 280 Z",
    labelX: 70.31,
    labelY: 52.7,
    fillColor: "#d5ecd0",
    sortOrder: 2,
  },
  {
    slug: "guinsiliban",
    nameEn: "Guinsiliban",
    nameFil: "Guinsiliban",
    nameBis: "Guinsiliban",
    description: "Southern tip — Giant Clam Sanctuary and watchtowers.",
    svgPath: "M 580 500 C 680 490, 760 530, 750 600 C 730 660, 640 680, 560 650 C 520 610, 530 540, 560 510 C 570 505, 575 502, 580 500 Z",
    labelX: 68.36,
    labelY: 77.67,
    fillColor: "#dde9c8",
    sortOrder: 3,
  },
  {
    slug: "sagay",
    nameEn: "Sagay",
    nameFil: "Sagay",
    nameBis: "Sagay",
    description: "Southwest municipality — Binangawan Falls access.",
    svgPath: "M 380 480 C 480 470, 560 510, 550 580 C 530 640, 450 660, 370 620 C 330 570, 340 510, 370 490 C 375 485, 378 482, 380 480 Z",
    labelX: 48.83,
    labelY: 77.67,
    fillColor: "#e4e8c4",
    sortOrder: 4,
  },
  {
    slug: "catarman",
    nameEn: "Catarman",
    nameFil: "Catarman",
    nameBis: "Catarman",
    description: "Western heritage corridor — Sunken Cemetery and Old Volcano.",
    svgPath: "M 140 180 C 250 140, 340 180, 360 280 C 370 380, 330 480, 250 520 C 160 540, 110 460, 100 360 C 95 280, 110 210, 140 180 Z",
    labelX: 27.34,
    labelY: 55.48,
    fillColor: "#cfe4dc",
    sortOrder: 5,
  },
];
