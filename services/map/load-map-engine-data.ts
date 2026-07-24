import { db } from "@/lib/db";
import type { Attraction, AttractionCategory, MapRoute, LocalizedString } from "@/features/map/types";

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

/** Load full vector map engine dataset from PostgreSQL. */
export async function loadMapEngineData(): Promise<MapEnginePayload> {
  const [rows, features, municipalities, routeRows] = await Promise.all([
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
  ]);

  const attractions: Attraction[] = rows.map((row) => {
    const photos = [
      ...(row.coverImage ? [row.coverImage] : []),
      ...row.photos.map((p) => p.url),
    ].filter((url, i, arr) => arr.indexOf(url) === i);

    return {
      id: row.slug,
      name: loc(row.nameEn, row.nameFil, row.nameBis),
      description: loc(row.descriptionEn, row.descriptionFil, row.descriptionBis),
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
      travelTime: loc("", "", ""),
      distanceFromCapitol: loc("", "", ""),
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

  return {
    attractions,
    features: mappedFeatures,
    municipalities: mappedMunicipalities,
    routes,
  };
}
