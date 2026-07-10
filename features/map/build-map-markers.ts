import type { Directory, Tourism } from "@prisma/client";
import {
  CAMIGUIN_LANDMARK_COORDS,
  CAMIGUIN_MUNICIPALITY_COORDS,
} from "./camiguin-island";
import type { MapMarker } from "./types";

function resolveLandmarkCoords(name: string, index: number) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(CAMIGUIN_LANDMARK_COORDS)) {
    if (key.includes(k)) return v;
  }
  return { x: 40 + (index % 5) * 6, y: 35 + (index % 4) * 8 };
}

const MUNICIPALITIES: MapMarker[] = [
  {
    id: "mun-mambajao",
    kind: "municipality",
    nameEn: "Mambajao",
    nameFil: "Mambajao",
    nameBis: "Mambajao",
    descriptionEn: "Provincial capital and commercial center",
    descriptionFil: "Kabisera ng lalawigan at sentro ng komersyo",
    descriptionBis: "Kapitolyo sa probinsya ug sentro sa komersyo",
    locationEn: "Central Camiguin",
    locationFil: "Gitnang Camiguin",
    locationBis: "Sentro sa Camiguin",
    x: CAMIGUIN_MUNICIPALITY_COORDS.mambajao.x,
    y: CAMIGUIN_MUNICIPALITY_COORDS.mambajao.y,
  },
  {
    id: "mun-mahinog",
    kind: "municipality",
    nameEn: "Mahinog",
    nameFil: "Mahinog",
    nameBis: "Mahinog",
    descriptionEn: "Northern municipality known for agriculture",
    descriptionFil: "Hilagang munisipalidad na kilala sa agrikultura",
    descriptionBis: "Amihanang munisipalidad nga kilala sa agrikultura",
    locationEn: "Northern Camiguin",
    locationFil: "Hilagang Camiguin",
    locationBis: "Amihan sa Camiguin",
    x: CAMIGUIN_MUNICIPALITY_COORDS.mahinog.x,
    y: CAMIGUIN_MUNICIPALITY_COORDS.mahinog.y,
  },
  {
    id: "mun-guinsiliban",
    kind: "municipality",
    nameEn: "Guinsiliban",
    nameFil: "Guinsiliban",
    nameBis: "Guinsiliban",
    descriptionEn: "Smallest municipality on the island",
    descriptionFil: "Pinakamaliit na munisipalidad sa isla",
    descriptionBis: "Pinakagamay nga munisipalidad sa isla",
    locationEn: "Eastern Camiguin",
    locationFil: "Silangang Camiguin",
    locationBis: "Silangan sa Camiguin",
    x: CAMIGUIN_MUNICIPALITY_COORDS.guinsiliban.x,
    y: CAMIGUIN_MUNICIPALITY_COORDS.guinsiliban.y,
  },
  {
    id: "mun-sagay",
    kind: "municipality",
    nameEn: "Sagay",
    nameFil: "Sagay",
    nameBis: "Sagay",
    descriptionEn: "Home to Sunken Cemetery landmark",
    descriptionFil: "Tahanan ng Sunken Cemetery",
    descriptionBis: "Balay sa Sunken Cemetery landmark",
    locationEn: "Northern Camiguin",
    locationFil: "Hilagang Camiguin",
    locationBis: "Amihan sa Camiguin",
    x: CAMIGUIN_MUNICIPALITY_COORDS.sagay.x,
    y: CAMIGUIN_MUNICIPALITY_COORDS.sagay.y,
  },
  {
    id: "mun-catarman",
    kind: "municipality",
    nameEn: "Catarman",
    nameFil: "Catarman",
    nameBis: "Catarman",
    descriptionEn: "Western municipality with hot springs",
    descriptionFil: "Kanlurang munisipalidad na may hot springs",
    descriptionBis: "Kanlurang munisipalidad nga naay hot springs",
    locationEn: "Western Camiguin",
    locationFil: "Kanlurang Camiguin",
    locationBis: "Kanlurang Camiguin",
    x: CAMIGUIN_MUNICIPALITY_COORDS.catarman.x,
    y: CAMIGUIN_MUNICIPALITY_COORDS.catarman.y,
  },
];

const CAPITOL_BASE = CAMIGUIN_MUNICIPALITY_COORDS.mambajao;

function capitolOffset(index: number): { x: number; y: number } {
  const ring = [
    { x: 0, y: 0 },
    { x: -4, y: -3 },
    { x: 4, y: -2 },
    { x: -3, y: 4 },
    { x: 5, y: 3 },
    { x: 0, y: -6 },
    { x: -6, y: 1 },
  ];
  const o = ring[index % ring.length];
  return { x: CAPITOL_BASE.x + o.x, y: CAPITOL_BASE.y + o.y };
}

function directoryToMarker(dir: Directory, index: number): MapMarker {
  const name = dir.nameEn;
  const isCapitol = dir.building?.toLowerCase().includes("capitol") || dir.type === "building";
  const pos = isCapitol ? capitolOffset(index) : capitolOffset(index + 3);

  const locationParts = [
    dir.building,
    dir.floor && `${dir.floor}`,
    dir.room && `Room ${dir.room}`,
  ].filter(Boolean);

  return {
    id: `dir-${dir.id}`,
    kind: "office",
    nameEn: dir.nameEn,
    nameFil: dir.nameFil,
    nameBis: dir.nameBis ?? undefined,
    descriptionEn: dir.descriptionEn ?? undefined,
    descriptionFil: dir.descriptionFil ?? undefined,
    descriptionBis: dir.descriptionBis ?? undefined,
    locationEn: locationParts.join(" · ") || dir.department || "Camiguin Provincial Capitol",
    locationFil: locationParts.join(" · ") || dir.department || "Provincial Capitol ng Camiguin",
    locationBis: locationParts.join(" · ") || dir.department || "Provincial Capitol sa Camiguin",
    x: pos.x,
    y: pos.y,
    department: dir.department ?? undefined,
    headName: dir.headName ?? undefined,
    contactNumber: dir.contactNumber ?? undefined,
    email: dir.email ?? undefined,
    building: dir.building ?? undefined,
    floor: dir.floor ?? undefined,
    room: dir.room ?? undefined,
    navigationQuery: name,
  };
}

function tourismToMarker(item: Tourism, index: number): MapMarker | null {
  const coords = resolveLandmarkCoords(item.titleEn, index);

  return {
    id: `tourism-${item.id}`,
    kind: "landmark",
    nameEn: item.titleEn,
    nameFil: item.titleFil,
    nameBis: item.titleBis ?? undefined,
    descriptionEn: item.descriptionEn,
    descriptionFil: item.descriptionFil,
    descriptionBis: item.descriptionBis ?? undefined,
    locationEn: item.location ?? "Camiguin Island",
    locationFil: item.location ?? "Isla ng Camiguin",
    locationBis: item.location ?? "Isla sa Camiguin",
    x: coords.x,
    y: coords.y,
  };
}

export function buildMapMarkers(directories: Directory[], tourism: Tourism[]): MapMarker[] {
  const seenOffices = new Set<string>();
  const offices = directories
    .filter((d) => d.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((d) => {
      const key = `${d.type}:${d.nameEn}`;
      if (seenOffices.has(key)) return false;
      seenOffices.add(key);
      return true;
    })
    .map((d, i) => directoryToMarker(d, i));

  const seenLandmarks = new Set<string>();
  const landmarks = tourism
    .filter((t) => t.isActive)
    .filter((t) => {
      if (seenLandmarks.has(t.titleEn)) return false;
      seenLandmarks.add(t.titleEn);
      return true;
    })
    .map((t, i) => tourismToMarker(t, i))
    .filter((m): m is MapMarker => m !== null);

  return [...offices, ...landmarks, ...MUNICIPALITIES];
}
