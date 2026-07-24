import { ModulePageClient } from "@/features/kiosk/module-page-client";
import { loadMapEngineData } from "@/services/map/load-map-engine-data";
import { CAMIGUIN_ATTRACTIONS } from "@/features/map/attractions";
import { CAMIGUIN_ROUTES } from "@/features/map/routes";
import { MAP_FEATURES, MUNICIPALITIES } from "@/data/map/geometry";
import type { MapEnginePayload } from "@/services/map/load-map-engine-data";
import { MapClient } from "./map-client";

function fallbackPayload(): MapEnginePayload {
  return {
    attractions: CAMIGUIN_ATTRACTIONS,
    routes: CAMIGUIN_ROUTES,
    features: MAP_FEATURES.map((f) => ({
      id: f.slug,
      slug: f.slug,
      kind: f.kind,
      nameEn: f.nameEn ?? null,
      nameFil: f.nameFil ?? null,
      nameBis: f.nameBis ?? null,
      svgPath: f.svgPath,
      fill: f.fill ?? null,
      stroke: f.stroke ?? null,
      zIndex: f.zIndex,
      animated: f.animated ?? false,
      meta: f.metaJson ? (JSON.parse(f.metaJson) as Record<string, unknown>) : null,
    })),
    municipalities: MUNICIPALITIES.map((m) => ({
      id: m.slug,
      slug: m.slug,
      nameEn: m.nameEn,
      nameFil: m.nameFil,
      nameBis: m.nameBis,
      svgPath: m.svgPath,
      labelX: m.labelX,
      labelY: m.labelY,
      fillColor: m.fillColor,
    })),
  };
}

export default async function MapPage() {
  let data: MapEnginePayload;
  try {
    data = await loadMapEngineData();
    if (!data.attractions.length) {
      data = fallbackPayload();
    }
  } catch {
    data = fallbackPayload();
  }

  return (
    <ModulePageClient
      icon="Map"
      fit
      hideBanner
      titleEn="Map of Camiguin"
      titleFil="Mapa ng Camiguin"
      titleBis="Mapa sa Camiguin"
      descriptionEn="Explore the Camiguin tourism map — search, zoom, and tap attractions for details."
      descriptionFil="Tuklasin ang tourism map ng Camiguin — maghanap, mag-zoom, at pindutin ang mga atraksiyon para sa detalye."
      descriptionBis="Suhola ang tourism map sa Camiguin — pangita, mag-zoom, ug pindota ang mga atraksyon para sa detalye."
    >
      <MapClient data={data} />
    </ModulePageClient>
  );
}
