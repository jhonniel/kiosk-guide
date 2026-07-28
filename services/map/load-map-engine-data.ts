import { db } from "@/lib/db";
import type {
  Attraction,
  AttractionCategory,
  MapEngineAnnotation,
  MapEngineCategory,
  MapPlacePin,
  MapRoute,
  LocalizedString,
} from "@/features/map/types";

export type MapEngineFeature = {
  id: string;
  slug: string;
  kind: string;
  nameEn: string | null;
  nameFil: string | null;
  nameBis: string | null;
  svgPath: string;
  fill: string | null;
  stroke: string | null;
  zIndex: number;
  animated: boolean;
  meta: Record<string, unknown> | null;
};

export type MapEngineMunicipality = {
  id: string;
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string | null;
  description: string | null;
  svgPath: string;
  labelX: number;
  labelY: number;
  fillColor: string;
};

export type MapEnginePayload = {
  attractions: Attraction[];
  features: MapEngineFeature[];
  municipalities: MapEngineMunicipality[];
  routes: MapRoute[];
  annotations: MapEngineAnnotation[];
  categories: MapEngineCategory[];
  hotels: MapPlacePin[];
  restaurants: MapPlacePin[];
};

function loc(en: string, fil?: string | null, bis?: string | null): LocalizedString {
  return { en, fil: fil || en, bis: bis || fil || en };
}

function parseMeta(metaJson: string | null): Record<string, unknown> | null {
  if (!metaJson) return null;
  try {
    return JSON.parse(metaJson) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function placeDescription(
  descriptionEn: string | null | undefined,
  descriptionFil: string | null | undefined,
  descriptionBis: string | null | undefined,
  legacy: string | null | undefined,
  fallback: string
): LocalizedString {
  const en = descriptionEn?.trim() || legacy?.trim() || fallback;
  return loc(en, descriptionFil || legacy, descriptionBis || descriptionFil || legacy);
}

/** Load full vector map engine dataset from PostgreSQL. */
export async function loadMapEngineData(): Promise<MapEnginePayload> {
  const [rows, features, municipalities, routeRows, annotationRows, categoryRows, hotelRows, restaurantRows] =
    await Promise.all([
      db.mapAttraction.findMany({
        where: { isActive: true },
        include: {
          category: true,
          photos: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      }),
      db.mapFeature.findMany({
        where: { isActive: true },
        orderBy: { zIndex: "asc" },
      }),
      db.mapMunicipality.findMany({
        orderBy: { sortOrder: "asc" },
      }),
      db.mapRoute.findMany({
        where: { isActive: true },
        include: {
          from: { select: { slug: true } },
          to: { select: { slug: true } },
        },
      }),
      db.mapAnnotation.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      db.mapCategory.findMany({
        orderBy: { sortOrder: "asc" },
      }),
      db.mapHotel.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      }),
      db.mapRestaurant.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      }),
    ]);

  const attractions: Attraction[] = rows.map((row) => {
    const photos = [
      ...(row.coverImage ? [row.coverImage] : []),
      ...row.photos.map((p) => p.url),
    ].filter((url, i, arr) => arr.indexOf(url) === i);

    const historyEn = row.historyEn?.trim();
    const labelSide = row.labelSide;
    const side =
      labelSide === "top" ||
      labelSide === "bottom" ||
      labelSide === "left" ||
      labelSide === "right"
        ? labelSide
        : null;

    return {
      id: row.slug,
      name: loc(row.nameEn, row.nameFil, row.nameBis),
      description: loc(row.descriptionEn, row.descriptionFil, row.descriptionBis),
      history: historyEn
        ? loc(historyEn, row.historyFil, row.historyBis)
        : undefined,
      category: row.category.slug as AttractionCategory,
      x: row.mapX,
      y: row.mapY,
      region: row.svgPath ?? undefined,
      photos,
      openingHours: loc(
        row.openingHoursEn ?? "Daytime",
        row.openingHoursFil,
        row.openingHoursBis
      ),
      entranceFee: loc(
        row.entranceFeeEn ?? "Varies",
        row.entranceFeeFil,
        row.entranceFeeBis
      ),
      rating: row.rating,
      travelTips: loc(
        row.travelTipsEn ?? "",
        row.travelTipsFil,
        row.travelTipsBis
      ),
      travelTime: loc(
        row.travelTimeEn ?? "",
        row.travelTimeFil,
        row.travelTimeBis
      ),
      distanceFromCapitol: loc(
        row.distanceFromCapitolEn ?? "",
        row.distanceFromCapitolFil,
        row.distanceFromCapitolBis
      ),
      phone: row.phone,
      website: row.website,
      labelText: row.labelText,
      labelDx: row.labelDx,
      labelDy: row.labelDy,
      labelSide: side,
    };
  });

  const mappedFeatures: MapEngineFeature[] = features.map((f) => ({
    id: f.id,
    slug: f.slug,
    kind: f.kind,
    nameEn: f.nameEn,
    nameFil: f.nameFil,
    nameBis: f.nameBis,
    svgPath: f.svgPath,
    fill: f.fill,
    stroke: f.stroke,
    zIndex: f.zIndex,
    animated: f.animated,
    meta: parseMeta(f.metaJson),
  }));

  const mappedMunicipalities: MapEngineMunicipality[] = municipalities.map((m) => ({
    id: m.id,
    slug: m.slug,
    nameEn: m.nameEn,
    nameFil: m.nameFil,
    nameBis: m.nameBis,
    description: m.description,
    svgPath: m.svgPath,
    labelX: m.labelX,
    labelY: m.labelY,
    fillColor: m.fillColor,
  }));

  const routes: MapRoute[] = routeRows.map((r) => {
    let points: Array<{ x: number; y: number }> = [];
    try {
      points = JSON.parse(r.pointsJson) as Array<{ x: number; y: number }>;
    } catch {
      points = [];
    }
    return {
      id: r.slug,
      fromId: r.from.slug,
      toId: r.to.slug,
      kind: r.kind === "boat" ? "boat" : "road",
      points,
      travelTime: loc(r.travelTimeEn ?? "", r.travelTimeFil, r.travelTimeBis),
    };
  });

  const annotations: MapEngineAnnotation[] = annotationRows.map((a) => {
    const anchor =
      a.anchor === "start" || a.anchor === "middle" || a.anchor === "end"
        ? a.anchor
        : null;
    const infoEn = a.infoEn?.trim();
    return {
      id: a.id,
      slug: a.slug,
      text: a.text,
      kind: a.kind,
      x: a.mapX,
      y: a.mapY,
      fontSize: a.fontSize,
      anchor,
      info: infoEn ? loc(infoEn, a.infoFil, a.infoBis) : null,
      skipIfAttractionSlug: a.skipIfAttractionSlug,
    };
  });

  const categories: MapEngineCategory[] = categoryRows.map((c) => ({
    id: c.id,
    slug: c.slug,
    nameEn: c.nameEn,
    nameFil: c.nameFil,
    nameBis: c.nameBis,
    color: c.color,
    icon: c.icon,
    sortOrder: c.sortOrder,
    showInFilter: c.showInFilter,
    showInLegend: c.showInLegend,
  }));

  const hotels: MapPlacePin[] = hotelRows.map((h) => ({
    id: h.slug,
    kind: "hotel" as const,
    name: loc(h.nameEn, h.nameFil, h.nameBis),
    description: placeDescription(
      h.descriptionEn,
      h.descriptionFil,
      h.descriptionBis,
      h.description,
      h.nameEn
    ),
    x: h.mapX,
    y: h.mapY,
    rating: h.rating,
    coverImage: h.coverImage,
    phone: h.phone,
    website: h.website,
    openingHours: loc(
      h.openingHoursEn ?? "",
      h.openingHoursFil,
      h.openingHoursBis
    ),
    address: h.addressEn,
  }));

  const restaurants: MapPlacePin[] = restaurantRows.map((r) => ({
    id: r.slug,
    kind: "restaurant" as const,
    name: loc(r.nameEn, r.nameFil, r.nameBis),
    description: placeDescription(
      r.descriptionEn,
      r.descriptionFil,
      r.descriptionBis,
      r.description,
      r.nameEn
    ),
    x: r.mapX,
    y: r.mapY,
    rating: r.rating,
    coverImage: r.coverImage,
    phone: r.phone,
    website: r.website,
    openingHours: loc(
      r.openingHoursEn ?? "",
      r.openingHoursFil,
      r.openingHoursBis
    ),
    address: r.addressEn,
  }));

  return {
    attractions,
    features: mappedFeatures,
    municipalities: mappedMunicipalities,
    routes,
    annotations,
    categories,
    hotels,
    restaurants,
  };
}
