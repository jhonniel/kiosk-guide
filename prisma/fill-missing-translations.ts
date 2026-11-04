/**
 * Fill-only backfill of Filipino and Cebuano content from prisma/filipino-content.ts and
 * prisma/bisaya-content.ts. A field is written only when it is empty or identical to English,
 * so translations entered by admins are never overwritten.
 *
 * Run: npx tsx prisma/fill-missing-translations.ts
 */
import { db } from "../lib/db";
import {
  BISAYA_ANNOUNCEMENTS,
  BISAYA_DIRECTORIES,
  BISAYA_DOWNLOADS,
  BISAYA_EMERGENCY,
  BISAYA_EVENTS,
  BISAYA_HOMEPAGE_CARDS,
  BISAYA_MAP_ATTRACTIONS,
  BISAYA_MAP_CATEGORIES,
  BISAYA_MAP_FEATURES,
  BISAYA_MAP_ROUTES,
  BISAYA_PAGES,
  BISAYA_QUICK_LINKS,
  BISAYA_SERVICES,
  BISAYA_TOURISM,
} from "./bisaya-content";
import {
  FILIPINO_DIRECTORIES,
  FILIPINO_EMERGENCY,
  FILIPINO_EVENTS,
  FILIPINO_MAP_ATTRACTIONS,
  FILIPINO_MAP_CATEGORIES,
  FILIPINO_MAP_FEATURES,
  FILIPINO_MAP_ROUTES,
  FILIPINO_SERVICES,
} from "./filipino-content";

type ModelName =
  | "quickLink"
  | "homepageCard"
  | "service"
  | "directory"
  | "download"
  | "announcement"
  | "tourism"
  | "emergencyContact"
  | "event"
  | "page"
  | "mapCategory"
  | "mapAttraction"
  | "mapRoute"
  | "mapFeature";

type Row = { id: string } & Record<string, unknown>;

type Delegate = {
  findMany: (args: { where: Record<string, string> }) => Promise<Row[]>;
  update: (args: { where: { id: string }; data: Record<string, string> }) => Promise<unknown>;
};

type Translation = {
  model: ModelName;
  where: Record<string, string>;
  values: Record<string, string | undefined>;
};

type Lang = "Fil" | "Bis";

/**
 * Cebuano values written by the old index-based announcement mapping onto unrelated rows.
 * They are not translations of those rows, so they may be replaced.
 */
const STALE_VALUES: Partial<Record<ModelName, Record<string, string[]>>> = {
  announcement: {
    titleBis: ["Lanzones Festival 2024", "Bag-ong Online Services Portal"],
    contentBis: [
      "Apil kita sa tinuig nga Lanzones Festival nga nagselebrar sa bulawan nga prutas sa Camiguin.",
      "Gilunsad sa provincial government ang bag-ong online services para sa mas paspas nga transaksyon.",
    ],
  },
};

function fromRecord<T extends object>(
  model: ModelName,
  keyField: string,
  dict: Record<string, T>
): Translation[] {
  return Object.entries(dict).map(([key, values]) => ({
    model,
    where: { [keyField]: key },
    values: values as Record<string, string | undefined>,
  }));
}

const TRANSLATIONS: Translation[] = [
  ...fromRecord("quickLink", "slug", BISAYA_QUICK_LINKS),
  ...fromRecord("homepageCard", "slug", BISAYA_HOMEPAGE_CARDS),
  ...fromRecord("service", "slug", BISAYA_SERVICES),
  ...fromRecord("service", "slug", FILIPINO_SERVICES),
  ...fromRecord("directory", "nameEn", BISAYA_DIRECTORIES),
  ...fromRecord("directory", "nameEn", FILIPINO_DIRECTORIES),
  ...fromRecord("download", "titleEn", BISAYA_DOWNLOADS),
  ...fromRecord("announcement", "titleEn", BISAYA_ANNOUNCEMENTS),
  ...fromRecord("tourism", "titleEn", BISAYA_TOURISM),
  ...fromRecord("emergencyContact", "nameEn", BISAYA_EMERGENCY),
  ...fromRecord("emergencyContact", "nameEn", FILIPINO_EMERGENCY),
  ...fromRecord("event", "titleEn", BISAYA_EVENTS),
  ...fromRecord("event", "titleEn", FILIPINO_EVENTS),
  ...fromRecord("page", "slug", BISAYA_PAGES),
  ...fromRecord("mapCategory", "slug", BISAYA_MAP_CATEGORIES),
  ...fromRecord("mapCategory", "slug", FILIPINO_MAP_CATEGORIES),
  ...fromRecord("mapAttraction", "slug", BISAYA_MAP_ATTRACTIONS),
  ...fromRecord("mapAttraction", "slug", FILIPINO_MAP_ATTRACTIONS),
  ...fromRecord("mapRoute", "slug", BISAYA_MAP_ROUTES),
  ...fromRecord("mapRoute", "slug", FILIPINO_MAP_ROUTES),
  ...fromRecord("mapFeature", "slug", BISAYA_MAP_FEATURES),
  ...fromRecord("mapFeature", "slug", FILIPINO_MAP_FEATURES),
];

const normalize = (value: unknown) => (value == null ? "" : String(value).trim());

function isMissing(current: unknown, english: unknown) {
  const value = normalize(current);
  return value === "" || value === normalize(english);
}

function langOf(field: string): Lang | null {
  if (field.endsWith("Fil")) return "Fil";
  if (field.endsWith("Bis")) return "Bis";
  return null;
}

async function main() {
  const client = db as unknown as Record<ModelName, Delegate>;
  const counts = new Map<ModelName, Record<Lang, { filled: number; corrected: number }>>();
  const bump = (model: ModelName, lang: Lang, kind: "filled" | "corrected") => {
    if (!counts.has(model)) {
      counts.set(model, { Fil: { filled: 0, corrected: 0 }, Bis: { filled: 0, corrected: 0 } });
    }
    counts.get(model)![lang][kind]++;
  };

  let unmatched = 0;
  for (const translation of TRANSLATIONS) {
    const rows = await client[translation.model].findMany({ where: translation.where });
    if (!rows.length) {
      unmatched++;
      continue;
    }

    for (const row of rows) {
      const data: Record<string, string> = {};
      for (const [field, value] of Object.entries(translation.values)) {
        const lang = langOf(field);
        if (!lang || !value) continue;
        const current = row[field];
        if (normalize(current) === normalize(value)) continue;

        const english = row[field.replace(/(Fil|Bis)$/, "En")];
        const stale = STALE_VALUES[translation.model]?.[field]?.includes(normalize(current)) ?? false;
        if (!isMissing(current, english) && !stale) continue;

        data[field] = value;
        bump(translation.model, lang, stale ? "corrected" : "filled");
      }
      if (Object.keys(data).length) {
        await client[translation.model].update({ where: { id: row.id }, data });
      }
    }
  }

  console.log("Fields filled per model (Fil / Bis):");
  let totalFil = 0;
  let totalBis = 0;
  for (const [model, byLang] of counts) {
    const corrected = byLang.Bis.corrected + byLang.Fil.corrected;
    totalFil += byLang.Fil.filled + byLang.Fil.corrected;
    totalBis += byLang.Bis.filled + byLang.Bis.corrected;
    console.log(
      `  ${model.padEnd(18)} Fil ${String(byLang.Fil.filled).padStart(3)}   Bis ${String(byLang.Bis.filled).padStart(3)}` +
        (corrected ? `   (+${corrected} stale mismatched value(s) corrected)` : "")
    );
  }
  if (!counts.size) console.log("  Nothing to fill — all targeted fields already translated.");
  console.log(`Total: Fil ${totalFil}, Bis ${totalBis}.`);
  if (unmatched) console.log(`${unmatched} dictionary entr${unmatched === 1 ? "y" : "ies"} matched no row (skipped).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
