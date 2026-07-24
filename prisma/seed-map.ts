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
        sortOrder: ATTRACTION_CATEGORIES.indexOf(cat),
      },
      create: {
        slug: cat.id,
        nameEn: cat.labelEn,
        nameFil: cat.labelFil,
        nameBis: cat.labelBis,
        color: cat.color,
        sortOrder: ATTRACTION_CATEGORIES.indexOf(cat),
      },
    });
  }

  for (const m of MUNICIPALITIES) {
    await prisma.mapMunicipality.upsert({
      where: { slug: m.slug },
      update: {
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
      create: {
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

    const attraction = await prisma.mapAttraction.upsert({
      where: { slug: a.id },
      update: {
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
        featured: index < 6,
        isActive: true,
        sortOrder: index,
      },
      create: {
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
        featured: index < 6,
        isActive: true,
        sortOrder: index,
      },
    });

    await prisma.mapPhoto.deleteMany({ where: { attractionId: attraction.id } });
    if (gallery.length) {
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
        pointsJson: JSON.stringify(route.points),
        travelTimeEn: route.travelTime.en,
        travelTimeFil: route.travelTime.fil,
        travelTimeBis: route.travelTime.bis,
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
  for (const r of sampleRestaurants) {
    await prisma.mapRestaurant.upsert({
      where: { slug: r.slug },
      update: { ...r, isActive: true },
      create: { ...r, isActive: true },
    });
  }

  const sampleHotels = [
    { slug: "paras-beach-resort", nameEn: "Paras Beach Resort", nameFil: "Paras Beach Resort", nameBis: "Paras Beach Resort", mapX: 41, mapY: 13, rating: 4.5 },
    { slug: "camiguin-highland-resort", nameEn: "Camiguin Highland Resort", nameFil: "Camiguin Highland Resort", nameBis: "Camiguin Highland Resort", mapX: 46, mapY: 28, rating: 4.2 },
  ];
  for (const h of sampleHotels) {
    await prisma.mapHotel.upsert({
      where: { slug: h.slug },
      update: { ...h, isActive: true },
      create: { ...h, isActive: true },
    });
  }

  const counts = {
    categories: await prisma.mapCategory.count(),
    municipalities: await prisma.mapMunicipality.count(),
    features: await prisma.mapFeature.count(),
    attractions: await prisma.mapAttraction.count(),
    routes: await prisma.mapRoute.count(),
  };
  console.log("Map engine seed counts:", counts);
}
