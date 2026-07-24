import { CAMIGUIN_ATTRACTIONS, getAttractionById } from "./attractions";
import type { Attraction, AttractionCategory } from "./types";
import { db } from "@/lib/db";
import type { LocalizedString } from "./types";

/**
 * Attraction data access — PostgreSQL first, local catalog as offline fallback.
 */
export interface AttractionRepository {
  list(): Promise<Attraction[]>;
  getById(id: string): Promise<Attraction | null>;
  listByCategory(category: AttractionCategory): Promise<Attraction[]>;
  search(query: string): Promise<Attraction[]>;
}

function loc(en: string, fil?: string | null, bis?: string | null): LocalizedString {
  return { en, fil: fil || en, bis: bis || fil || en };
}

export class PrismaAttractionRepository implements AttractionRepository {
  async list() {
    const rows = await db.mapAttraction.findMany({
      where: { isActive: true },
      include: {
        category: true,
        photos: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { sortOrder: "asc" },
    });

    if (!rows.length) return CAMIGUIN_ATTRACTIONS;

    return rows.map((row) => {
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
        travelTips: loc(row.travelTipsEn ?? "", row.travelTipsFil, row.travelTipsBis),
        travelTime: loc("", "", ""),
        distanceFromCapitol: loc("", "", ""),
      } satisfies Attraction;
    });
  }

  async getById(id: string) {
    const all = await this.list();
    return all.find((a) => a.id === id) ?? null;
  }

  async listByCategory(category: AttractionCategory) {
    const all = await this.list();
    return all.filter((a) => a.category === category);
  }

  async search(query: string) {
    const q = query.trim().toLowerCase();
    const all = await this.list();
    if (!q) return all;
    return all.filter((a) => {
      const hay = `${a.name.en} ${a.name.fil} ${a.name.bis} ${a.description.en} ${a.category}`;
      return hay.toLowerCase().includes(q);
    });
  }
}

export class LocalAttractionRepository implements AttractionRepository {
  async list() {
    return CAMIGUIN_ATTRACTIONS;
  }

  async getById(id: string) {
    return getAttractionById(id);
  }

  async listByCategory(category: AttractionCategory) {
    return CAMIGUIN_ATTRACTIONS.filter((a) => a.category === category);
  }

  async search(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return CAMIGUIN_ATTRACTIONS;
    return CAMIGUIN_ATTRACTIONS.filter((a) => {
      const hay = `${a.name.en} ${a.name.fil} ${a.name.bis} ${a.description.en} ${a.category}`;
      return hay.toLowerCase().includes(q);
    });
  }
}

export const attractionRepository: AttractionRepository = new PrismaAttractionRepository();
