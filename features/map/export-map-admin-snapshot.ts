import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { db } from "@/lib/db";

const OUT = path.join(process.cwd(), "prisma", "data", "map-admin-snapshot.json");

/** Write current DB map admin state into the committed snapshot file. */
export async function writeMapAdminSnapshotFile(): Promise<string> {
  const [attractions, annotations, hotels, restaurants, municipalities, routes] =
    await Promise.all([
      db.mapAttraction.findMany({
        orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
        select: {
          slug: true,
          nameEn: true,
          nameFil: true,
          nameBis: true,
          descriptionEn: true,
          descriptionFil: true,
          descriptionBis: true,
          mapX: true,
          mapY: true,
          latitude: true,
          longitude: true,
          isActive: true,
          featured: true,
          sortOrder: true,
          coverImage: true,
          labelText: true,
          labelSide: true,
          category: { select: { slug: true } },
          municipality: { select: { slug: true } },
        },
      }),
      db.mapAnnotation.findMany({
        orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
        select: {
          slug: true,
          text: true,
          kind: true,
          mapX: true,
          mapY: true,
          fontSize: true,
          anchor: true,
          infoEn: true,
          infoFil: true,
          infoBis: true,
          skipIfAttractionSlug: true,
          isActive: true,
          sortOrder: true,
        },
      }),
      db.mapHotel.findMany({ orderBy: [{ sortOrder: "asc" }, { slug: "asc" }] }),
      db.mapRestaurant.findMany({ orderBy: [{ sortOrder: "asc" }, { slug: "asc" }] }),
      db.mapMunicipality.findMany({
        orderBy: { sortOrder: "asc" },
        select: {
          slug: true,
          labelX: true,
          labelY: true,
          nameEn: true,
          nameFil: true,
          nameBis: true,
        },
      }),
      db.mapRoute.findMany({
        orderBy: { slug: "asc" },
        include: {
          from: { select: { slug: true } },
          to: { select: { slug: true } },
        },
      }),
    ]);

  const snapshot = {
    exportedAt: new Date().toISOString(),
    attractions: attractions.map((a) => ({
      slug: a.slug,
      nameEn: a.nameEn,
      nameFil: a.nameFil,
      nameBis: a.nameBis,
      descriptionEn: a.descriptionEn,
      descriptionFil: a.descriptionFil,
      descriptionBis: a.descriptionBis,
      categorySlug: a.category.slug,
      municipalitySlug: a.municipality?.slug ?? null,
      mapX: a.mapX,
      mapY: a.mapY,
      latitude: a.latitude,
      longitude: a.longitude,
      isActive: a.isActive,
      featured: a.featured,
      sortOrder: a.sortOrder,
      coverImage: a.coverImage,
      labelText: a.labelText,
      labelSide: a.labelSide,
    })),
    annotations,
    hotels: hotels.map((h) => ({
      slug: h.slug,
      nameEn: h.nameEn,
      nameFil: h.nameFil,
      nameBis: h.nameBis,
      descriptionEn: h.descriptionEn ?? h.description,
      descriptionFil: h.descriptionFil,
      descriptionBis: h.descriptionBis,
      mapX: h.mapX,
      mapY: h.mapY,
      coverImage: h.coverImage,
      phone: h.phone,
      website: h.website,
      openingHoursEn: h.openingHoursEn,
      addressEn: h.addressEn,
      rating: h.rating,
      isActive: h.isActive,
      sortOrder: h.sortOrder,
    })),
    restaurants: restaurants.map((r) => ({
      slug: r.slug,
      nameEn: r.nameEn,
      nameFil: r.nameFil,
      nameBis: r.nameBis,
      descriptionEn: r.descriptionEn ?? r.description,
      descriptionFil: r.descriptionFil,
      descriptionBis: r.descriptionBis,
      mapX: r.mapX,
      mapY: r.mapY,
      coverImage: r.coverImage,
      phone: r.phone,
      website: r.website,
      openingHoursEn: r.openingHoursEn,
      addressEn: r.addressEn,
      rating: r.rating,
      isActive: r.isActive,
      sortOrder: r.sortOrder,
    })),
    municipalities,
    routes: routes.map((r) => ({
      slug: r.slug,
      nameEn: r.nameEn,
      nameFil: r.nameFil,
      nameBis: r.nameBis,
      kind: r.kind,
      fromSlug: r.from.slug,
      toSlug: r.to.slug,
      pointsJson: r.pointsJson,
      travelTimeEn: r.travelTimeEn,
      travelTimeFil: r.travelTimeFil,
      travelTimeBis: r.travelTimeBis,
      distanceKm: r.distanceKm,
      isActive: r.isActive,
    })),
  };

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return OUT;
}
