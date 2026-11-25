import { existsSync, readFileSync } from "fs";
import path from "path";
import type { PrismaClient } from "@prisma/client";
import { ATTRACTION_CATEGORIES } from "../features/map/categories";
import { CAMIGUIN_ATTRACTIONS } from "../features/map/attractions";
import { CAMIGUIN_ROUTES } from "../features/map/routes";
import {
  MAP_FEATURES,
  MUNICIPALITIES,
  mapPercentToLatLng,
} from "../data/map/geometry";
import {
  TRACED_MAIN_ISLAND,
  TRACED_MANTIGUE,
  TRACED_ROADS,
  TRACED_WHITE_ISLAND,
} from "../data/map/traced-paths";
import { ATTRACTION_GEO } from "../data/map/attraction-geo";
import { MAP_ANNOTATIONS } from "@/data/map/map-spot-labels";

type MapAdminSnapshot = {
  exportedAt?: string;
  attractions?: Array<{
    slug: string;
    nameEn: string;
    nameFil: string;
    nameBis?: string | null;
    descriptionEn: string;
    descriptionFil: string;
    descriptionBis?: string | null;
    categorySlug: string;
    municipalitySlug?: string | null;
    mapX: number;
    mapY: number;
    latitude: number;
    longitude: number;
    isActive: boolean;
    featured?: boolean;
    sortOrder?: number;
    coverImage?: string | null;
    labelText?: string | null;
    labelSide?: string | null;
  }>;
  annotations?: Array<{
    slug: string;
    text: string;
    kind: string;
    mapX: number;
    mapY: number;
    fontSize?: number | null;
    anchor?: string | null;
    infoEn?: string | null;
    infoFil?: string | null;
    infoBis?: string | null;
    skipIfAttractionSlug?: string | null;
    isActive: boolean;
    sortOrder?: number;
  }>;
  hotels?: Array<{
    slug: string;
    nameEn: string;
    nameFil: string;
    nameBis?: string | null;
    descriptionEn?: string | null;
    descriptionFil?: string | null;
    descriptionBis?: string | null;
    mapX: number;
    mapY: number;
    coverImage?: string | null;
    phone?: string | null;
    website?: string | null;
    openingHoursEn?: string | null;
    addressEn?: string | null;
    rating?: number;
    isActive: boolean;
    sortOrder?: number;
  }>;
  restaurants?: Array<{
    slug: string;
    nameEn: string;
    nameFil: string;
    nameBis?: string | null;
    descriptionEn?: string | null;
    descriptionFil?: string | null;
    descriptionBis?: string | null;
    mapX: number;
    mapY: number;
    coverImage?: string | null;
    phone?: string | null;
    website?: string | null;
    openingHoursEn?: string | null;
    addressEn?: string | null;
    rating?: number;
    isActive: boolean;
    sortOrder?: number;
  }>;
  municipalities?: Array<{
    slug: string;
    labelX: number;
    labelY: number;
    nameEn?: string;
    nameFil?: string;
    nameBis?: string | null;
  }>;
  routes?: Array<{
    slug: string;
    nameEn: string;
    nameFil: string;
    nameBis?: string | null;
    kind: string;
    fromSlug: string;
    toSlug: string;
    pointsJson: string;
    travelTimeEn?: string | null;
    travelTimeFil?: string | null;
    travelTimeBis?: string | null;
    distanceKm?: number | null;
    isActive: boolean;
  }>;
};

function loadMapAdminSnapshot(): MapAdminSnapshot | null {
  const filePath = path.join(process.cwd(), "prisma", "data", "map-admin-snapshot.json");
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as MapAdminSnapshot;
  } catch (e) {
    console.warn("Could not read map-admin-snapshot.json:", e);
    return null;
  }
}

/**
 * Apply committed admin map edits (positions, visibility, custom places)
 * so `git push` + `db:seed` restores the same map on other machines.
 */
async function applyMapAdminSnapshot(prisma: PrismaClient) {
  const snapshot = loadMapAdminSnapshot();
  if (!snapshot) {
    console.log("No prisma/data/map-admin-snapshot.json — skipping admin map restore.");
    return;
  }

  console.log(
    `Applying map admin snapshot${snapshot.exportedAt ? ` (${snapshot.exportedAt})` : ""}…`
  );

  const categories = await prisma.mapCategory.findMany({ select: { id: true, slug: true } });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const municipalities = await prisma.mapMunicipality.findMany({ select: { id: true, slug: true } });
  const muniBySlug = new Map(municipalities.map((m) => [m.slug, m.id]));

  for (const a of snapshot.attractions ?? []) {
    const categoryId = categoryBySlug.get(a.categorySlug);
    if (!categoryId) continue;
    const municipalityId = a.municipalitySlug ? muniBySlug.get(a.municipalitySlug) ?? null : null;
    await prisma.mapAttraction.upsert({
      where: { slug: a.slug },
      update: {
        nameEn: a.nameEn,
        nameFil: a.nameFil,
        nameBis: a.nameBis ?? null,
        descriptionEn: a.descriptionEn,
        descriptionFil: a.descriptionFil,
        descriptionBis: a.descriptionBis ?? null,
        categoryId,
        municipalityId,
        mapX: a.mapX,
        mapY: a.mapY,
        latitude: a.latitude,
        longitude: a.longitude,
        isActive: a.isActive,
        featured: Boolean(a.featured),
        sortOrder: a.sortOrder ?? 0,
        coverImage: a.coverImage ?? null,
        labelText: a.labelText ?? null,
        labelSide: a.labelSide ?? null,
      },
      create: {
        slug: a.slug,
        nameEn: a.nameEn,
        nameFil: a.nameFil,
        nameBis: a.nameBis ?? null,
        descriptionEn: a.descriptionEn,
        descriptionFil: a.descriptionFil,
        descriptionBis: a.descriptionBis ?? null,
        categoryId,
        municipalityId,
        mapX: a.mapX,
        mapY: a.mapY,
        latitude: a.latitude,
        longitude: a.longitude,
        isActive: a.isActive,
        featured: Boolean(a.featured),
        sortOrder: a.sortOrder ?? 0,
        coverImage: a.coverImage ?? null,
        labelText: a.labelText ?? null,
        labelSide: a.labelSide ?? null,
      },
    });
  }

  for (const ann of snapshot.annotations ?? []) {
    await prisma.mapAnnotation.upsert({
      where: { slug: ann.slug },
      update: {
        text: ann.text,
        kind: ann.kind,
        mapX: ann.mapX,
        mapY: ann.mapY,
        fontSize: ann.fontSize ?? null,
        anchor: ann.anchor ?? null,
        infoEn: ann.infoEn ?? null,
        infoFil: ann.infoFil ?? null,
        infoBis: ann.infoBis ?? null,
        skipIfAttractionSlug: ann.skipIfAttractionSlug ?? null,
        isActive: ann.isActive,
        sortOrder: ann.sortOrder ?? 0,
      },
      create: {
        slug: ann.slug,
        text: ann.text,
        kind: ann.kind,
        mapX: ann.mapX,
        mapY: ann.mapY,
        fontSize: ann.fontSize ?? null,
        anchor: ann.anchor ?? null,
        infoEn: ann.infoEn ?? null,
        infoFil: ann.infoFil ?? null,
        infoBis: ann.infoBis ?? null,
        skipIfAttractionSlug: ann.skipIfAttractionSlug ?? null,
        isActive: ann.isActive,
        sortOrder: ann.sortOrder ?? 0,
      },
    });
  }

  for (const h of snapshot.hotels ?? []) {
    const descriptionEn = h.descriptionEn?.trim() || h.nameEn;
    await prisma.mapHotel.upsert({
      where: { slug: h.slug },
      update: {
        nameEn: h.nameEn,
        nameFil: h.nameFil,
        nameBis: h.nameBis ?? null,
        description: descriptionEn,
        descriptionEn,
        descriptionFil: h.descriptionFil ?? null,
        descriptionBis: h.descriptionBis ?? null,
        mapX: h.mapX,
        mapY: h.mapY,
        coverImage: h.coverImage ?? null,
        phone: h.phone ?? null,
        website: h.website ?? null,
        openingHoursEn: h.openingHoursEn ?? null,
        addressEn: h.addressEn ?? null,
        rating: h.rating ?? 4,
        isActive: h.isActive,
        sortOrder: h.sortOrder ?? 0,
      },
      create: {
        slug: h.slug,
        nameEn: h.nameEn,
        nameFil: h.nameFil,
        nameBis: h.nameBis ?? null,
        description: descriptionEn,
        descriptionEn,
        descriptionFil: h.descriptionFil ?? null,
        descriptionBis: h.descriptionBis ?? null,
        mapX: h.mapX,
        mapY: h.mapY,
        coverImage: h.coverImage ?? null,
        phone: h.phone ?? null,
        website: h.website ?? null,
        openingHoursEn: h.openingHoursEn ?? null,
        addressEn: h.addressEn ?? null,
        rating: h.rating ?? 4,
        isActive: h.isActive,
        sortOrder: h.sortOrder ?? 0,
      },
    });
  }

  for (const r of snapshot.restaurants ?? []) {
    const descriptionEn = r.descriptionEn?.trim() || r.nameEn;
    await prisma.mapRestaurant.upsert({
      where: { slug: r.slug },
      update: {
        nameEn: r.nameEn,
        nameFil: r.nameFil,
        nameBis: r.nameBis ?? null,
        description: descriptionEn,
        descriptionEn,
        descriptionFil: r.descriptionFil ?? null,
        descriptionBis: r.descriptionBis ?? null,
        mapX: r.mapX,
        mapY: r.mapY,
        coverImage: r.coverImage ?? null,
        phone: r.phone ?? null,
        website: r.website ?? null,
        openingHoursEn: r.openingHoursEn ?? null,
        addressEn: r.addressEn ?? null,
        rating: r.rating ?? 4,
        isActive: r.isActive,
        sortOrder: r.sortOrder ?? 0,
      },
      create: {
        slug: r.slug,
        nameEn: r.nameEn,
        nameFil: r.nameFil,
        nameBis: r.nameBis ?? null,
        description: descriptionEn,
        descriptionEn,
        descriptionFil: r.descriptionFil ?? null,
        descriptionBis: r.descriptionBis ?? null,
        mapX: r.mapX,
        mapY: r.mapY,
        coverImage: r.coverImage ?? null,
        phone: r.phone ?? null,
        website: r.website ?? null,
        openingHoursEn: r.openingHoursEn ?? null,
        addressEn: r.addressEn ?? null,
        rating: r.rating ?? 4,
        isActive: r.isActive,
        sortOrder: r.sortOrder ?? 0,
      },
    });
  }

  for (const m of snapshot.municipalities ?? []) {
    await prisma.mapMunicipality.updateMany({
      where: { slug: m.slug },
      data: {
        labelX: m.labelX,
        labelY: m.labelY,
        ...(m.nameEn ? { nameEn: m.nameEn } : {}),
        ...(m.nameFil ? { nameFil: m.nameFil } : {}),
        ...(m.nameBis !== undefined ? { nameBis: m.nameBis } : {}),
      },
    });
  }

  const attractions = await prisma.mapAttraction.findMany({ select: { id: true, slug: true } });
  const attractionIdBySlug = new Map(attractions.map((a) => [a.slug, a.id]));

  for (const route of snapshot.routes ?? []) {
    const fromId = attractionIdBySlug.get(route.fromSlug);
    const toId = attractionIdBySlug.get(route.toSlug);
    if (!fromId || !toId) continue;
    await prisma.mapRoute.upsert({
      where: { slug: route.slug },
      update: {
        nameEn: route.nameEn,
        nameFil: route.nameFil,
        nameBis: route.nameBis ?? null,
        kind: route.kind,
        fromId,
        toId,
        pointsJson: route.pointsJson,
        travelTimeEn: route.travelTimeEn ?? null,
        travelTimeFil: route.travelTimeFil ?? null,
        travelTimeBis: route.travelTimeBis ?? null,
        distanceKm: route.distanceKm ?? null,
        isActive: route.isActive,
      },
      create: {
        slug: route.slug,
        nameEn: route.nameEn,
        nameFil: route.nameFil,
        nameBis: route.nameBis ?? null,
        kind: route.kind,
        fromId,
        toId,
        pointsJson: route.pointsJson,
        travelTimeEn: route.travelTimeEn ?? null,
        travelTimeFil: route.travelTimeFil ?? null,
        travelTimeBis: route.travelTimeBis ?? null,
        distanceKm: route.distanceKm ?? null,
        isActive: route.isActive,
      },
    });
  }

  console.log("Map admin snapshot applied.");
}

/** Features derived from the master tourism map (traced vectors). */
function masterTracedFeatures() {
  const features = [
    {
      slug: "master-coastline",
      kind: "coastline",
      nameEn: "Camiguin Island",
      nameFil: "Isla ng Camiguin",
      nameBis: "Isla sa Camiguin",
      svgPath: TRACED_MAIN_ISLAND,
      fill: null as string | null,
      stroke: "#f59e0b",
      zIndex: 10,
      animated: false,
      metaJson: JSON.stringify({ source: "traced", artwork: "/images/camiguin-tourist-map.png" }),
    },
    ...TRACED_WHITE_ISLAND.map((svgPath, i) => ({
      slug: `master-white-island-${i}`,
      kind: "island",
      nameEn: "White Island",
      nameFil: "White Island",
      nameBis: "White Island",
      svgPath,
      fill: "#f7f3e8",
      stroke: "#e8d9b0",
      zIndex: 12,
      animated: false,
      metaJson: JSON.stringify({ source: "traced" }),
    })),
    ...TRACED_MANTIGUE.map((svgPath, i) => ({
      slug: `master-mantigue-${i}`,
      kind: "island",
      nameEn: "Mantigue Island",
      nameFil: "Mantigue Island",
      nameBis: "Mantigue Island",
      svgPath,
      fill: "#cfe8b8",
      stroke: "#6b9e6e",
      zIndex: 12,
      animated: false,
      metaJson: JSON.stringify({ source: "traced" }),
    })),
    ...TRACED_ROADS.map((svgPath, i) => ({
      slug: `master-road-${i}`,
      kind: "road",
      nameEn: `Road segment ${i + 1}`,
      nameFil: `Road segment ${i + 1}`,
      nameBis: `Road segment ${i + 1}`,
      svgPath,
      fill: "none",
      stroke: "#f59e0b",
      zIndex: 30,
      animated: true,
      metaJson: JSON.stringify({ source: "traced", strokeWidth: 3 }),
    })),
  ];
  return features;
}

/** Guess municipality from attraction map position / known sites. */
function municipalitySlugFor(attractionId: string, x: number, y: number): string | null {
  if (
    ["white-island", "balbagon-port", "airport", "ardent-hot-spring", "katibawasan-falls", "soda-water-pool", "volcano-observatory", "mt-hibok-hibok"].includes(
      attractionId
    )
  ) {
    return "mambajao";
  }
  if (["mantigue-island", "benoni-port", "giant-clam-sanctuary"].includes(attractionId) && attractionId !== "giant-clam-sanctuary") {
    return "mahinog";
  }
  if (attractionId === "mantigue-island" || attractionId === "benoni-port") return "mahinog";
  if (["giant-clam-sanctuary", "cabuan-eco-village", "moro-watch-tower"].includes(attractionId)) {
    return "guinsiliban";
  }
  if (["binangawan-falls", "macau-springs"].includes(attractionId)) return "sagay";
  if (
    [
      "sunken-cemetery",
      "old-church-ruins",
      "tuasan-falls",
      "sto-nino-cold-spring",
      "walkway-old-volcano",
    ].includes(attractionId)
  ) {
    return "catarman";
  }
  // Fallback by rough region
  if (y < 32 && x > 30) return "mambajao";
  if (x > 62) return "mahinog";
  if (y > 70 && x > 50) return "guinsiliban";
  if (y > 55 && x < 55) return "sagay";
  if (x < 40) return "catarman";
  return "mambajao";
}

export async function seedMapEngine(prisma: PrismaClient) {
  console.log("Seeding interactive map engine…");

  for (const cat of ATTRACTION_CATEGORIES) {
    await prisma.mapCategory.upsert({
      where: { slug: cat.id },
      update: {
        nameEn: cat.labelEn,
        nameFil: cat.labelFil,
        nameBis: cat.labelBis,
        color: cat.color,
        showInFilter: cat.filterable,
        showInLegend: cat.legend,
        sortOrder: ATTRACTION_CATEGORIES.indexOf(cat),
      },
      create: {
        slug: cat.id,
        nameEn: cat.labelEn,
        nameFil: cat.labelFil,
        nameBis: cat.labelBis,
        color: cat.color,
        showInFilter: cat.filterable,
        showInLegend: cat.legend,
        sortOrder: ATTRACTION_CATEGORIES.indexOf(cat),
      },
    });
  }

  for (const m of MUNICIPALITIES) {
    const existingMuni = await prisma.mapMunicipality.findUnique({ where: { slug: m.slug } });
    if (!existingMuni) {
      await prisma.mapMunicipality.create({
        data: {
          slug: m.slug,
          nameEn: m.nameEn,
          nameFil: m.nameFil,
          nameBis: m.nameBis,
          description: m.description,
          svgPath: m.svgPath,
          labelX: m.labelX,
          labelY: m.labelY,
          fillColor: m.fillColor,
          sortOrder: m.sortOrder,
        },
      });
    }
  }

  for (const f of [...MAP_FEATURES, ...masterTracedFeatures()]) {
    await prisma.mapFeature.upsert({
      where: { slug: f.slug },
      update: {
        kind: f.kind,
        nameEn: f.nameEn,
        nameFil: f.nameFil,
        nameBis: f.nameBis,
        svgPath: f.svgPath,
        fill: f.fill,
        stroke: f.stroke,
        zIndex: f.zIndex,
        animated: f.animated ?? false,
        metaJson: f.metaJson,
        isActive: true,
      },
      create: {
        slug: f.slug,
        kind: f.kind,
        nameEn: f.nameEn,
        nameFil: f.nameFil,
        nameBis: f.nameBis,
        svgPath: f.svgPath,
        fill: f.fill,
        stroke: f.stroke,
        zIndex: f.zIndex,
        animated: f.animated ?? false,
        metaJson: f.metaJson,
        isActive: true,
      },
    });
  }

  const categories = await prisma.mapCategory.findMany();
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const municipalities = await prisma.mapMunicipality.findMany();
  const muniBySlug = new Map(municipalities.map((m) => [m.slug, m.id]));

  for (const [index, a] of CAMIGUIN_ATTRACTIONS.entries()) {
    const categoryId = categoryBySlug.get(a.category);
    if (!categoryId) continue;

    const muniSlug = municipalitySlugFor(a.id, a.x, a.y);
    const municipalityId = muniSlug ? muniBySlug.get(muniSlug) : undefined;
    const geo = ATTRACTION_GEO[a.id as keyof typeof ATTRACTION_GEO];
    const { latitude, longitude } = geo
      ? { latitude: geo.lat, longitude: geo.lng }
      : mapPercentToLatLng(a.x, a.y);
    const mapX = geo?.x ?? a.x;
    const mapY = geo?.y ?? a.y;
    const cover = a.photos.find((p) => !p.includes("camiguin-tourist-map")) ?? a.photos[0] ?? null;
    const gallery = a.photos.filter((p) => !p.includes("camiguin-tourist-map"));

    // Create-only: never overwrite admin edits (names, positions, isActive, etc.).
    const existingAttraction = await prisma.mapAttraction.findUnique({ where: { slug: a.id } });
    const attraction = existingAttraction
      ? existingAttraction
      : await prisma.mapAttraction.create({
          data: {
            slug: a.id,
            nameEn: a.name.en,
            nameFil: a.name.fil,
            nameBis: a.name.bis,
            descriptionEn: a.description.en,
            descriptionFil: a.description.fil,
            descriptionBis: a.description.bis,
            categoryId,
            municipalityId: municipalityId ?? null,
            latitude,
            longitude,
            mapX,
            mapY,
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

    // Fill travel/distance from catalog only when still empty (never overwrite admin edits)
    if (!attraction.travelTimeEn || !attraction.distanceFromCapitolEn) {
      await prisma.mapAttraction.update({
        where: { id: attraction.id },
        data: {
          ...(attraction.travelTimeEn
            ? {}
            : {
                travelTimeEn: a.travelTime.en,
                travelTimeFil: a.travelTime.fil,
                travelTimeBis: a.travelTime.bis,
              }),
          ...(attraction.distanceFromCapitolEn
            ? {}
            : {
                distanceFromCapitolEn: a.distanceFromCapitol.en,
                distanceFromCapitolFil: a.distanceFromCapitol.fil,
                distanceFromCapitolBis: a.distanceFromCapitol.bis,
              }),
        },
      });
    }

    const photoCount = await prisma.mapPhoto.count({ where: { attractionId: attraction.id } });
    if (photoCount === 0 && gallery.length) {
      await prisma.mapPhoto.createMany({
        data: gallery.map((url, sortOrder) => ({
          attractionId: attraction.id,
          url,
          sortOrder,
        })),
      });
    }
  }

  const attractions = await prisma.mapAttraction.findMany({ select: { id: true, slug: true } });
  const attractionBySlug = new Map(attractions.map((a) => [a.slug, a.id]));
  const attractionSlugs = new Set(attractions.map((a) => a.slug));

  for (const [index, annotation] of MAP_ANNOTATIONS.entries()) {
    const skipIfAttractionSlug =
      annotation.skipIfAttraction && attractionSlugs.has(annotation.id) ? annotation.id : null;

    // Create-only: preserve admin text/position/isActive edits and soft-deletes.
    const existingAnn = await prisma.mapAnnotation.findUnique({ where: { slug: annotation.id } });
    if (!existingAnn) {
      await prisma.mapAnnotation.create({
        data: {
          slug: annotation.id,
          text: annotation.text,
          kind: annotation.kind,
          mapX: annotation.x,
          mapY: annotation.y,
          fontSize: annotation.fontSize ?? null,
          anchor: annotation.anchor ?? null,
          skipIfAttractionSlug,
          sortOrder: index,
          isActive: true,
        },
      });
    }
  }

  for (const route of CAMIGUIN_ROUTES) {
    const fromId = attractionBySlug.get(route.fromId);
    const toId = attractionBySlug.get(route.toId);
    if (!fromId || !toId) continue;

    await prisma.mapRoute.upsert({
      where: { slug: route.id },
      update: {
        nameEn: `${route.fromId} → ${route.toId}`,
        nameFil: `${route.fromId} → ${route.toId}`,
        nameBis: `${route.fromId} → ${route.toId}`,
        kind: route.kind,
        fromId,
        toId,
        isActive: true,
      },
      create: {
        slug: route.id,
        nameEn: `${route.fromId} → ${route.toId}`,
        nameFil: `${route.fromId} → ${route.toId}`,
        nameBis: `${route.fromId} → ${route.toId}`,
        kind: route.kind,
        fromId,
        toId,
        pointsJson: JSON.stringify(route.points),
        travelTimeEn: route.travelTime.en,
        travelTimeFil: route.travelTime.fil,
        travelTimeBis: route.travelTime.bis,
        isActive: true,
      },
    });
  }

  // Sample restaurants / hotels as map POIs
  const sampleRestaurants = [
    { slug: "paras-beach-resort-dining", nameEn: "Paras Beach Resort Dining", nameFil: "Paras Beach Resort Dining", nameBis: "Paras Beach Resort Dining", mapX: 42, mapY: 14, rating: 4.4 },
    { slug: "secret-cove", nameEn: "Secret Cove", nameFil: "Secret Cove", nameBis: "Secret Cove", mapX: 50, mapY: 16, rating: 4.3 },
  ];
  for (const [index, r] of sampleRestaurants.entries()) {
    await prisma.mapRestaurant.upsert({
      where: { slug: r.slug },
      update: {
        nameEn: r.nameEn,
        nameFil: r.nameFil,
        nameBis: r.nameBis,
        rating: r.rating,
        isActive: true,
        sortOrder: index,
      },
      create: {
        ...r,
        descriptionEn: r.nameEn,
        isActive: true,
        sortOrder: index,
      },
    });
  }

  const sampleHotels = [
    { slug: "paras-beach-resort", nameEn: "Paras Beach Resort", nameFil: "Paras Beach Resort", nameBis: "Paras Beach Resort", mapX: 41, mapY: 13, rating: 4.5 },
    { slug: "camiguin-highland-resort", nameEn: "Camiguin Highland Resort", nameFil: "Camiguin Highland Resort", nameBis: "Camiguin Highland Resort", mapX: 46, mapY: 28, rating: 4.2 },
  ];
  for (const [index, h] of sampleHotels.entries()) {
    await prisma.mapHotel.upsert({
      where: { slug: h.slug },
      update: {
        nameEn: h.nameEn,
        nameFil: h.nameFil,
        nameBis: h.nameBis,
        rating: h.rating,
        isActive: true,
        sortOrder: index,
      },
      create: {
        ...h,
        descriptionEn: h.nameEn,
        isActive: true,
        sortOrder: index,
      },
    });
  }

  await applyMapAdminSnapshot(prisma);

  const counts = {
    categories: await prisma.mapCategory.count(),
    municipalities: await prisma.mapMunicipality.count(),
    features: await prisma.mapFeature.count(),
    attractions: await prisma.mapAttraction.count(),
    routes: await prisma.mapRoute.count(),
    annotations: await prisma.mapAnnotation.count(),
  };
  console.log("Map engine seed counts:", counts);
}
