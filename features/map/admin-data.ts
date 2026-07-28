/**
 * Server-side map admin data loader (NOT a Server Action).
 * Calling loaders from "use server" files during RSC render can fail auth
 * and get misreported as "please sign in".
 */
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { mapPercentToLatLng } from "@/data/map/geometry";
import { ATTRACTION_GEO } from "@/data/map/attraction-geo";
import { MAP_ANNOTATIONS } from "@/data/map/map-spot-labels";
import { ATTRACTION_CATEGORIES } from "@/features/map/categories";
import { CAMIGUIN_ATTRACTIONS } from "@/features/map/attractions";
import { CAMIGUIN_ROUTES } from "@/features/map/routes";
import type {
  MapAttractionAdminRow,
  MapAnnotationAdminRow,
  MapCategoryAdminOption,
  MapMunicipalityAdminRow,
  MapPlaceAdminRow,
  MapRouteAdminRow,
} from "@/features/map/admin-types";

export type {
  MapPhotoAdminRow,
  MapAttractionAdminRow,
  MapCategoryAdminOption,
  MapAnnotationAdminRow,
  MapRouteAdminRow,
  MapPlaceAdminRow,
  MapMunicipalityAdminRow,
} from "@/features/map/admin-types";

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

function parsePoints(pointsJson: string): Array<{ x: number; y: number }> {
  try {
    const pts = JSON.parse(pointsJson) as Array<{ x: number; y: number }>;
    return Array.isArray(pts) ? pts : [];
  } catch {
    return [];
  }
}

/**
 * Bootstrap catalog data only when a table is empty.
 * Never recreate missing rows — admin deletions must stick across reloads.
 */
async function ensureMapCatalogSynced() {
  const [categoryCount, attractionCount, annotationCount, routeCount] = await Promise.all([
    db.mapCategory.count(),
    db.mapAttraction.count(),
    db.mapAnnotation.count(),
    db.mapRoute.count(),
  ]);

  if (categoryCount === 0) {
    for (const cat of ATTRACTION_CATEGORIES) {
      await db.mapCategory.create({
        data: {
          slug: cat.id,
          nameEn: cat.labelEn,
          nameFil: cat.labelFil,
          nameBis: cat.labelBis,
          color: cat.color,
          sortOrder: ATTRACTION_CATEGORIES.findIndex((c) => c.id === cat.id),
          showInFilter: cat.filterable,
          showInLegend: cat.legend,
        },
      });
    }
  }

  if (attractionCount === 0) {
    const categories = await db.mapCategory.findMany({ select: { id: true, slug: true } });
    const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    for (const [index, a] of CAMIGUIN_ATTRACTIONS.entries()) {
      const categoryId = categoryBySlug.get(a.category);
      if (!categoryId) continue;

      const geo = ATTRACTION_GEO[a.id as keyof typeof ATTRACTION_GEO];
      const mapX = geo?.x ?? a.x;
      const mapY = geo?.y ?? a.y;
      const { latitude, longitude } = geo
        ? { latitude: geo.lat, longitude: geo.lng }
        : mapPercentToLatLng(mapX, mapY);
      const cover =
        a.photos.find((p) => !p.includes("camiguin-tourist-map")) ?? a.photos[0] ?? null;

      await db.mapAttraction.create({
        data: {
          slug: a.id,
          nameEn: a.name.en,
          nameFil: a.name.fil,
          nameBis: a.name.bis,
          descriptionEn: a.description.en,
          descriptionFil: a.description.fil,
          descriptionBis: a.description.bis,
          categoryId,
          mapX,
          mapY,
          latitude,
          longitude,
          svgPath: a.region ?? null,
          coverImage: cover,
          entranceFeeEn: a.entranceFee.en,
          entranceFeeFil: a.entranceFee.fil,
          entranceFeeBis: a.entranceFee.bis,
          openingHoursEn: a.openingHours.en,
          openingHoursFil: a.openingHours.fil,
          openingHoursBis: a.openingHours.bis,
          rating: a.rating,
          travelTipsEn: a.travelTips.en,
          travelTipsFil: a.travelTips.fil,
          travelTipsBis: a.travelTips.bis,
          travelTimeEn: a.travelTime.en,
          travelTimeFil: a.travelTime.fil,
          travelTimeBis: a.travelTime.bis,
          distanceFromCapitolEn: a.distanceFromCapitol.en,
          distanceFromCapitolFil: a.distanceFromCapitol.fil,
          distanceFromCapitolBis: a.distanceFromCapitol.bis,
          featured: index < 6,
          isActive: true,
          sortOrder: index,
        },
      });
    }
  }

  if (annotationCount === 0) {
    const attractionSlugs = new Set(
      (await db.mapAttraction.findMany({ select: { slug: true } })).map((a) => a.slug)
    );

    for (const [index, ann] of MAP_ANNOTATIONS.entries()) {
      await db.mapAnnotation.create({
        data: {
          slug: ann.id,
          text: ann.text,
          kind: ann.kind,
          mapX: ann.x,
          mapY: ann.y,
          fontSize: ann.fontSize ?? null,
          anchor: ann.anchor ?? null,
          skipIfAttractionSlug:
            ann.skipIfAttraction && attractionSlugs.has(ann.id) ? ann.id : null,
          isActive: true,
          sortOrder: index,
        },
      });
    }
  }

  if (routeCount === 0) {
    const attractionsBySlug = await db.mapAttraction.findMany({
      select: { id: true, slug: true, mapX: true, mapY: true },
    });
    const attractionIdBySlug = new Map(attractionsBySlug.map((a) => [a.slug, a]));

    for (const route of CAMIGUIN_ROUTES) {
      const from = attractionIdBySlug.get(route.fromId);
      const to = attractionIdBySlug.get(route.toId);
      if (!from || !to) continue;
      const points =
        route.points.length > 0
          ? route.points
          : [
              { x: from.mapX, y: from.mapY },
              { x: to.mapX, y: to.mapY },
            ];
      await db.mapRoute.create({
        data: {
          slug: route.id,
          nameEn: `${route.fromId} → ${route.toId}`,
          nameFil: `${route.fromId} → ${route.toId}`,
          nameBis: `${route.fromId} → ${route.toId}`,
          kind: route.kind,
          fromId: from.id,
          toId: to.id,
          pointsJson: JSON.stringify(points),
          travelTimeEn: route.travelTime.en,
          travelTimeFil: route.travelTime.fil,
          travelTimeBis: route.travelTime.bis,
          isActive: true,
        },
      });
    }
  }
}

function mapAttractionRow(
  row: Awaited<ReturnType<typeof db.mapAttraction.findMany>>[number] & {
    category: { slug: string; nameEn: string };
    photos: Array<{ id: string; url: string; caption: string | null; sortOrder: number }>;
  }
): MapAttractionAdminRow {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameFil: row.nameFil,
    nameBis: row.nameBis,
    descriptionEn: row.descriptionEn,
    descriptionFil: row.descriptionFil,
    descriptionBis: row.descriptionBis,
    historyEn: row.historyEn,
    historyFil: row.historyFil,
    historyBis: row.historyBis,
    categoryId: row.categoryId,
    categorySlug: row.category.slug,
    categoryName: row.category.nameEn,
    municipalityId: row.municipalityId,
    mapX: row.mapX,
    mapY: row.mapY,
    latitude: row.latitude,
    longitude: row.longitude,
    coverImage: row.coverImage,
    entranceFeeEn: row.entranceFeeEn,
    entranceFeeFil: row.entranceFeeFil,
    entranceFeeBis: row.entranceFeeBis,
    openingHoursEn: row.openingHoursEn,
    openingHoursFil: row.openingHoursFil,
    openingHoursBis: row.openingHoursBis,
    travelTipsEn: row.travelTipsEn,
    travelTipsFil: row.travelTipsFil,
    travelTipsBis: row.travelTipsBis,
    travelTimeEn: row.travelTimeEn,
    travelTimeFil: row.travelTimeFil,
    travelTimeBis: row.travelTimeBis,
    distanceFromCapitolEn: row.distanceFromCapitolEn,
    distanceFromCapitolFil: row.distanceFromCapitolFil,
    distanceFromCapitolBis: row.distanceFromCapitolBis,
    phone: row.phone,
    website: row.website,
    rating: row.rating,
    labelText: row.labelText,
    labelDx: row.labelDx,
    labelDy: row.labelDy,
    labelSide: row.labelSide,
    featured: row.featured,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    photos: row.photos.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      sortOrder: p.sortOrder,
    })),
  };
}

function mapPlaceRow(row: {
  id: string;
  slug: string;
  nameEn: string;
  nameFil: string;
  nameBis: string | null;
  description: string | null;
  descriptionEn: string | null;
  descriptionFil: string | null;
  descriptionBis: string | null;
  coverImage: string | null;
  phone: string | null;
  website: string | null;
  openingHoursEn: string | null;
  openingHoursFil: string | null;
  openingHoursBis: string | null;
  addressEn: string | null;
  mapX: number;
  mapY: number;
  rating: number;
  isActive: boolean;
  sortOrder: number;
}): MapPlaceAdminRow {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.nameEn,
    nameFil: row.nameFil,
    nameBis: row.nameBis,
    descriptionEn: row.descriptionEn ?? row.description,
    descriptionFil: row.descriptionFil,
    descriptionBis: row.descriptionBis,
    coverImage: row.coverImage,
    phone: row.phone,
    website: row.website,
    openingHoursEn: row.openingHoursEn,
    openingHoursFil: row.openingHoursFil,
    openingHoursBis: row.openingHoursBis,
    addressEn: row.addressEn,
    mapX: row.mapX,
    mapY: row.mapY,
    rating: row.rating,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

export async function loadMapAdminData(): Promise<{
  attractions: MapAttractionAdminRow[];
  categories: MapCategoryAdminOption[];
  annotations: MapAnnotationAdminRow[];
  routes: MapRouteAdminRow[];
  hotels: MapPlaceAdminRow[];
  restaurants: MapPlaceAdminRow[];
  municipalities: MapMunicipalityAdminRow[];
}> {
  await requireAdmin();
  await ensureMapCatalogSynced();

  const [rows, categories, annotations, routes, hotels, restaurants, municipalities] =
    await Promise.all([
      db.mapAttraction.findMany({
        include: { category: true, photos: { orderBy: { sortOrder: "asc" } } },
        orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
      }),
      db.mapCategory.findMany({
        include: { _count: { select: { attractions: true } } },
        orderBy: { sortOrder: "asc" },
      }),
      db.mapAnnotation.findMany({
        orderBy: [{ sortOrder: "asc" }, { text: "asc" }],
      }),
      db.mapRoute.findMany({
        include: {
          from: { select: { slug: true, nameEn: true } },
          to: { select: { slug: true, nameEn: true } },
        },
        orderBy: { nameEn: "asc" },
      }),
      db.mapHotel.findMany({ orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }] }),
      db.mapRestaurant.findMany({ orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }] }),
      db.mapMunicipality.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);

  return {
    attractions: rows.map(mapAttractionRow),
    categories: categories.map((c) => ({
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
      attractionCount: c._count.attractions,
    })),
    annotations: annotations.map((a) => ({
      id: a.id,
      slug: a.slug,
      text: a.text,
      kind: a.kind,
      mapX: a.mapX,
      mapY: a.mapY,
      fontSize: a.fontSize,
      anchor: a.anchor,
      infoEn: a.infoEn,
      infoFil: a.infoFil,
      infoBis: a.infoBis,
      skipIfAttractionSlug: a.skipIfAttractionSlug,
      isActive: a.isActive,
      sortOrder: a.sortOrder,
    })),
    routes: routes.map((r) => ({
      id: r.id,
      slug: r.slug,
      nameEn: r.nameEn,
      nameFil: r.nameFil,
      nameBis: r.nameBis,
      kind: r.kind,
      fromId: r.fromId,
      toId: r.toId,
      fromSlug: r.from.slug,
      toSlug: r.to.slug,
      fromName: r.from.nameEn,
      toName: r.to.nameEn,
      points: parsePoints(r.pointsJson),
      travelTimeEn: r.travelTimeEn,
      travelTimeFil: r.travelTimeFil,
      travelTimeBis: r.travelTimeBis,
      distanceKm: r.distanceKm,
      isActive: r.isActive,
    })),
    hotels: hotels.map(mapPlaceRow),
    restaurants: restaurants.map(mapPlaceRow),
    municipalities: municipalities.map((m) => ({
      id: m.id,
      slug: m.slug,
      nameEn: m.nameEn,
      nameFil: m.nameFil,
      nameBis: m.nameBis,
      description: m.description,
      labelX: m.labelX,
      labelY: m.labelY,
      fillColor: m.fillColor,
      sortOrder: m.sortOrder,
    })),
  };
}
