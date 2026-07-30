"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { TransformComponent, TransformWrapper, useControls } from "react-zoom-pan-pinch";
import { Minus, Plus, RotateCcw, Route, Moon, Sun, Maximize2, Bed, UtensilsCrossed, X } from "lucide-react";
import { buildStraightRoute, findRoute } from "@/features/map/routes";
import type { Attraction, MapPlacePin, MapRoute } from "@/features/map/types";
import type {
  MapEngineMunicipality,
  MapEnginePayload,
} from "@/services/map/load-map-engine-data";
import { useKiosk } from "@/hooks/use-kiosk";
import { useMapCamera } from "@/hooks/use-map-camera";
import { useMapSearch } from "@/hooks/use-map-search";
import { pickLang } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import { AmbientEffects } from "./AmbientEffects";
import { Compass } from "./Compass";
import { MapFilters } from "./Filters";
import { Legend } from "./Legend";
import {
  AttractionHitRegions,
  renderAttractionObject,
} from "./AttractionObjects";
import {
  AttractionBottomSheet,
  AttractionPopup,
  AttractionSidebar,
  type DetailLabels,
} from "./Popup";
import { RouteLayer } from "./RouteLayer";
import { MapSearch } from "./Search";
import { VectorTerrain } from "./VectorTerrain";
import { WatercolorMapDecor } from "./WatercolorMapDecor";
import { MapTerrainLabels } from "./MapTerrainLabels";

const FAV_KEY = "camiguin-map-favorites";

function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function InnerControls({
  onReset,
  routeMode,
  onToggleRouteMode,
  nightMode,
  onToggleNight,
  onFullscreen,
  labels,
}: {
  onReset: () => void;
  routeMode: boolean;
  onToggleRouteMode: () => void;
  nightMode: boolean;
  onToggleNight: () => void;
  onFullscreen: () => void;
  labels: {
    zoomIn: string;
    zoomOut: string;
    reset: string;
    route: string;
    theme: string;
    fullscreen: string;
  };
}) {
  const { zoomIn, zoomOut } = useControls();
  return (
    <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => zoomIn(0.35)}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-kiosk-navy shadow-md ring-1 ring-slate-200 backdrop-blur"
        aria-label={labels.zoomIn}
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => zoomOut(0.35)}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-kiosk-navy shadow-md ring-1 ring-slate-200 backdrop-blur"
        aria-label={labels.zoomOut}
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex h-10 items-center gap-1.5 rounded-xl bg-white/90 px-3 text-xs font-semibold text-kiosk-navy shadow-md ring-1 ring-slate-200 backdrop-blur"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {labels.reset}
      </button>
      <button
        type="button"
        onClick={onToggleRouteMode}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-md ring-1 backdrop-blur",
          routeMode
            ? "bg-kiosk-navy text-white ring-kiosk-navy"
            : "bg-white/90 text-kiosk-navy ring-slate-200"
        )}
      >
        <Route className="h-3.5 w-3.5" />
        {labels.route}
      </button>
      <button
        type="button"
        onClick={onToggleNight}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-kiosk-navy shadow-md ring-1 ring-slate-200 backdrop-blur"
        aria-label={labels.theme}
      >
        {nightMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={onFullscreen}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-kiosk-navy shadow-md ring-1 ring-slate-200 backdrop-blur"
        aria-label={labels.fullscreen}
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function labelOf(language: "en" | "fil" | "bis", a: Attraction) {
  if (language === "fil") return a.name.fil;
  if (language === "bis") return a.name.bis;
  return a.name.en;
}

type Props = {
  data: MapEnginePayload;
};

export function CamiguinTourismMap({ data }: Props) {
  const { language } = useKiosk();
  const attractions = data.attractions;
  const municipalities = data.municipalities;
  const dbRoutes = data.routes;
  const hotels = data.hotels ?? [];
  const restaurants = data.restaurants ?? [];
  const annotations = data.annotations ?? [];
  const categories = data.categories ?? [];

  // Painted mountains follow active peak labels only — deleting a volcano/peak removes its art.
  const peakPositions = useMemo(
    () =>
      annotations
        .filter((a) => a.kind === "peak")
        .map((a) => ({ id: a.slug, x: a.x, y: a.y })),
    [annotations]
  );

  const { setApi, flyTo, resetView } = useMapCamera();
  const search = useMapSearch(attractions);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<MapPlacePin | null>(null);
  const [annotationInfo, setAnnotationInfo] = useState<{
    text: string;
    info: string;
  } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [routeMode, setRouteMode] = useState(false);
  const [routeStart, setRouteStart] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<MapRoute | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [nightMode, setNightMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [cursorPercent, setCursorPercent] = useState({ x: 50, y: 50 });
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.match(/attraction=([a-z0-9-]+)/i)?.[1];
    if (hash && attractions.some((a) => a.id === hash)) {
      setSelectedId(hash);
      window.setTimeout(() => {
        const a = attractions.find((item) => item.id === hash);
        if (a) flyTo(a.x, a.y);
      }, 400);
    }
  }, [attractions, flyTo]);

  const selected = useMemo(
    () => attractions.find((a) => a.id === selectedId) ?? null,
    [attractions, selectedId]
  );

  const selectedMunicipality = useMemo(() => {
    if (!selected) return null;
    // Nearest municipality label to selected attraction
    let best: MapEngineMunicipality | null = null;
    let bestD = Infinity;
    for (const m of municipalities) {
      const d = Math.hypot(m.labelX - selected.x, m.labelY - selected.y);
      if (d < bestD) {
        bestD = d;
        best = m;
      }
    }
    return best;
  }, [municipalities, selected]);

  const visible = search.filtered;

  const availableCategories = useMemo(() => {
    const set = new Set(attractions.map((a) => a.category));
    if (hotels.length) set.add("hotel");
    if (restaurants.length) set.add("restaurant");
    return set;
  }, [attractions, hotels.length, restaurants.length]);

  const municipalityLabels = useMemo(
    () =>
      municipalities.map((m) => ({
        slug: m.slug,
        text: (m.nameEn || m.slug).toUpperCase(),
        labelX: m.labelX,
        labelY: m.labelY,
      })),
    [municipalities]
  );

  const terrainAnnotations = useMemo(() => {
    const attractionIds = new Set(attractions.map((a) => a.id));
    return annotations
      .filter(
        (a) =>
          !a.skipIfAttractionSlug || !attractionIds.has(a.skipIfAttractionSlug)
      )
      .map((a) => ({
        id: a.slug,
        text: a.text,
        kind: a.kind,
        x: a.x,
        y: a.y,
        fontSize: a.fontSize,
        anchor: a.anchor,
        isActive: true,
      }));
  }, [annotations, attractions]);

  const showHotels =
    search.activeCategories.length === 0 ||
    search.activeCategories.includes("hotel");
  const showRestaurants =
    search.activeCategories.length === 0 ||
    search.activeCategories.includes("restaurant");

  const nearby = useMemo(() => {
    if (!selected) return [];
    return attractions
      .filter((a) => a.id !== selected.id)
      .map((a) => ({
        a,
        d: Math.hypot(a.x - selected.x, a.y - selected.y),
      }))
      .sort((x, y) => x.d - y.d)
      .slice(0, 4)
      .map((x) => x.a);
  }, [attractions, selected]);

  const detailLabels: DetailLabels = {
    fee: pickLang(language, "Entrance fee", "Entrance fee", "Entrance fee"),
    hours: pickLang(language, "Hours", "Oras", "Oras"),
    tips: pickLang(language, "Travel tips", "Mga tip", "Mga tip"),
    directions: pickLang(language, "Directions", "Direksyon", "Direksyon"),
    share: pickLang(language, "Share", "I-share", "I-share"),
    favorite: pickLang(language, "Favorite", "Paborito", "Paborito"),
    travelTime: pickLang(language, "Travel time", "Oras ng biyahe", "Oras sa biyahe"),
    distance: pickLang(language, "Distance", "Layo", "Kalayo"),
    nearby: pickLang(language, "Nearby", "Malapit", "Duol"),
  };

  const resolveRoute = useCallback(
    (fromId: string, toId: string, from: Attraction, to: Attraction): MapRoute => {
      const fromDb =
        dbRoutes.find((r) => r.fromId === fromId && r.toId === toId) ??
        dbRoutes.find((r) => r.fromId === toId && r.toId === fromId);
      if (fromDb) return fromDb;
      const predefined = findRoute(fromId, toId);
      if (predefined) return predefined;
      return buildStraightRoute(
        fromId,
        toId,
        { x: from.x, y: from.y },
        { x: to.x, y: to.y },
        to.category === "beach" ||
          to.category === "marine" ||
          from.category === "port" ||
          to.category === "port"
          ? "boat"
          : "road"
      );
    },
    [dbRoutes]
  );

  const selectAttraction = useCallback(
    (id: string) => {
      setSelectedPlace(null);
      setAnnotationInfo(null);
      const a = attractions.find((item) => item.id === id);
      if (!a) return;

      if (routeMode) {
        if (!routeStart) {
          setRouteStart(id);
          setSelectedId(id);
          flyTo(a.x, a.y, 1.8);
          return;
        }
        if (routeStart === id) return;
        const from = attractions.find((item) => item.id === routeStart);
        if (!from) return;
        const route = resolveRoute(routeStart, id, from, a);
        setActiveRoute(route);
        setSelectedId(id);
        flyTo(a.x, a.y, 1.7);
        setRouteStart(null);
        setRouteMode(false);
        return;
      }

      setSelectedId(id);
      setActiveRoute(null);
      flyTo(a.x, a.y);
      search.pushRecent(labelOf(language, a));
    },
    [attractions, flyTo, language, resolveRoute, routeMode, routeStart, search]
  );

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setSelectedPlace(null);
    setAnnotationInfo(null);
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!selectedId) return;
    setFavorites((prev) => {
      const next = prev.includes(selectedId)
        ? prev.filter((id) => id !== selectedId)
        : [...prev, selectedId];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [selectedId]);

  const shareAttraction = useCallback(async () => {
    if (!selected) return;
    const url = `${window.location.pathname}${window.location.search}#attraction=${selected.id}`;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
    } catch {
      window.location.hash = `attraction=${selected.id}`;
    }
  }, [selected]);

  const onApiReady = useCallback(
    (api: ReactZoomPanPinchRef) => {
      setApi(api);
    },
    [setApi]
  );

  const toggleFullscreen = useCallback(() => {
    if (!rootEl) return;
    if (!document.fullscreenElement) {
      void rootEl.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  }, [rootEl]);

  return (
    <div
      ref={setRootEl}
      className={cn(
        "relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-sky-900/15 shadow-xl",
        nightMode ? "bg-[#0a4a66]" : "bg-[#5eb0cc]"
      )}
    >
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={5}
        centerOnInit
        wheel={{ step: 0.12 }}
        doubleClick={{ mode: "zoomIn", step: 0.55 }}
        panning={{ velocityDisabled: false }}
        limitToBounds
        onInit={(ref) => onApiReady(ref)}
        onTransform={(_, state) => {
          setZoomLevel(state.scale);
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="pointer-events-auto min-w-0 flex-1 space-y-2">
              <MapSearch
                query={search.query}
                onQueryChange={search.setQuery}
                suggestions={search.suggestions}
                recent={search.recent}
                labelOf={(a) => labelOf(language, a)}
                placeholder={pickLang(
                  language,
                  "Search White Island, falls, ports…",
                  "Maghanap ng White Island, talon, pantalan…",
                  "Pangita og White Island, busay, pantalan…"
                )}
                recentLabel={pickLang(language, "Recent", "Kamakailan", "Bagbag-o")}
                onPick={(a) => {
                  search.setQuery(labelOf(language, a));
                  selectAttraction(a.id);
                }}
                onPickRecent={(label) => {
                  search.setQuery(label);
                  const match = attractions.find(
                    (a) =>
                      a.name.en === label || a.name.fil === label || a.name.bis === label
                  );
                  if (match) selectAttraction(match.id);
                }}
              />
              <MapFilters
                language={language}
                active={search.activeCategories}
                available={availableCategories}
                onToggle={search.toggleCategory}
                onClear={search.clearCategories}
                allLabel={pickLang(language, "All", "Lahat", "Tanan")}
                categories={categories}
              />
            </div>
            <div className="pointer-events-auto flex flex-col items-end gap-2">
              <Compass />
              <InnerControls
                onReset={() => {
                  resetView();
                  setActiveRoute(null);
                  setRouteStart(null);
                }}
                routeMode={routeMode}
                onToggleRouteMode={() => {
                  setRouteMode((v) => !v);
                  setRouteStart(null);
                  setActiveRoute(null);
                }}
                nightMode={nightMode}
                onToggleNight={() => setNightMode((v) => !v)}
                onFullscreen={toggleFullscreen}
                labels={{
                  zoomIn: pickLang(language, "Zoom in", "Mag-zoom in", "Mag-zoom in"),
                  zoomOut: pickLang(language, "Zoom out", "Mag-zoom out", "Mag-zoom out"),
                  reset: pickLang(language, "Reset", "I-reset", "I-reset"),
                  route: routeStart
                    ? pickLang(language, "Pick end", "Pili ng dulo", "Pili og katapusan")
                    : pickLang(language, "Route", "Ruta", "Ruta"),
                  theme: pickLang(language, "Day / night", "Araw / gabi", "Adlaw / gabii"),
                  fullscreen: pickLang(language, "Fullscreen", "Fullscreen", "Fullscreen"),
                }}
              />
            </div>
          </div>
          {routeMode && (
            <p className="pointer-events-none rounded-xl bg-kiosk-navy/85 px-3 py-2 text-xs font-medium text-white shadow">
              {routeStart
                ? pickLang(
                    language,
                    "Tap a destination to draw the route.",
                    "Pindutin ang destinasyon para iguhit ang ruta.",
                    "Pindota ang destinasyon aron idrowing ang ruta."
                  )
                : pickLang(
                    language,
                    "Route mode: tap a start attraction.",
                    "Route mode: pindutin ang panimulang attraction.",
                    "Route mode: pindota ang sinugdanan nga attraction."
                  )}
            </p>
          )}
        </div>

        <TransformComponent
          wrapperClass="!h-full !w-full !max-w-none"
          contentClass="!h-full !w-full !max-w-none"
          wrapperStyle={{ width: "100%", height: "100%", maxWidth: "none" }}
          contentStyle={{ width: "100%", height: "100%", maxWidth: "none" }}
        >
          {/* Must be in-flow + explicit size — library defaults to fit-content */}
          <div
            className={cn(
              "relative box-border select-none",
              nightMode ? "bg-[#0a3348]" : "bg-[#5eb0cc]"
            )}
            data-kiosk-zoom-surface
            style={{
              width: "100%",
              height: "100%",
              minWidth: "100%",
              minHeight: "100%",
              backgroundImage: nightMode
                ? "radial-gradient(ellipse at 70% 15%, rgba(255,255,255,0.12), transparent 55%), linear-gradient(145deg, #0a3348 0%, #0c4a66 40%, #082a3a 100%)"
                : "radial-gradient(ellipse at 70% 15%, rgba(255,255,255,0.32), transparent 55%), linear-gradient(145deg, #5eb0cc 0%, #7ec8de 40%, #4a9bbb 100%)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <div
                data-map-stage
                className="map-watercolor-art relative aspect-[1024/721] h-full max-h-full w-auto max-w-full"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setCursorPercent({
                    x: ((e.clientX - rect.left) / rect.width) * 100,
                    y: ((e.clientY - rect.top) / rect.height) * 100,
                  });
                }}
              >
                <VectorTerrain
                  selectedMunicipalitySlug={selectedMunicipality?.slug ?? null}
                  routeRoadActive={Boolean(activeRoute && activeRoute.kind === "road")}
                  nightMode={nightMode}
                  language={language}
                  hideOcean
                />
                <WatercolorMapDecor
                  nightMode={nightMode}
                  hoveredAttractionId={hoveredId}
                  peakPositions={peakPositions}
                />
                <AmbientEffects nightMode={nightMode} />
                <MapTerrainLabels
                  selectedMunicipalitySlug={selectedMunicipality?.slug ?? null}
                  nightMode={nightMode}
                  annotations={terrainAnnotations}
                  municipalityLabels={municipalityLabels}
                />
                <AttractionHitRegions
                  attractions={visible}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onHover={setHoveredId}
                  onSelect={selectAttraction}
                />
                <RouteLayer route={activeRoute} />
                {visible.map((a) =>
                  renderAttractionObject(a.id, {
                    attraction: a,
                    selected: selectedId === a.id,
                    hovered: hoveredId === a.id,
                    label: labelOf(language, a),
                    labelVisible: true,
                    onHover: setHoveredId,
                    onSelect: selectAttraction,
                  })
                )}
                {showHotels &&
                  hotels.map((h) => (
                    <button
                      key={`hotel-${h.id}`}
                      type="button"
                      className="absolute z-[10] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                      style={{ left: `${h.x}%`, top: `${h.y}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(null);
                        setAnnotationInfo(null);
                        setSelectedPlace(h);
                        flyTo(h.x, h.y);
                      }}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-600 shadow-lg">
                        <Bed className="h-3.5 w-3.5 text-white" />
                      </span>
                      <span className="map-spot-label mt-0.5 max-w-[7rem]">
                        {pickLang(language, h.name.en, h.name.fil, h.name.bis)}
                      </span>
                    </button>
                  ))}
                {showRestaurants &&
                  restaurants.map((r) => (
                    <button
                      key={`restaurant-${r.id}`}
                      type="button"
                      className="absolute z-[10] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                      style={{ left: `${r.x}%`, top: `${r.y}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(null);
                        setAnnotationInfo(null);
                        setSelectedPlace(r);
                        flyTo(r.x, r.y);
                      }}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-amber-500 shadow-lg">
                        <UtensilsCrossed className="h-3.5 w-3.5 text-white" />
                      </span>
                      <span className="map-spot-label mt-0.5 max-w-[7rem]">
                        {pickLang(language, r.name.en, r.name.fil, r.name.bis)}
                      </span>
                    </button>
                  ))}
                {annotations
                  .filter((a) => a.info && pickLang(language, a.info.en, a.info.fil, a.info.bis).trim())
                  .map((a) => (
                    <button
                      key={`ann-hit-${a.slug}`}
                      type="button"
                      aria-label={a.text}
                      className="absolute z-[9] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{ left: `${a.x}%`, top: `${a.y}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(null);
                        setSelectedPlace(null);
                        setAnnotationInfo({
                          text: a.text,
                          info: pickLang(
                            language,
                            a.info!.en,
                            a.info!.fil,
                            a.info!.bis
                          ),
                        });
                      }}
                    />
                  ))}
              </div>
            </div>
          </div>
        </TransformComponent>

        {/* Tourism-map legend — bottom left, always visible */}
        <div className="pointer-events-none absolute bottom-9 left-3 z-30 sm:bottom-10 sm:left-4">
          <Legend
            language={language}
            title={pickLang(language, "Legend", "Alamat", "Legenda")}
          />
        </div>

        {activeRoute && (
          <div className="pointer-events-none absolute bottom-10 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-kiosk-navy shadow-lg backdrop-blur">
            {activeRoute.kind === "boat" ? "Boat · " : "Road · "}
            {language === "fil"
              ? activeRoute.travelTime.fil
              : language === "bis"
                ? activeRoute.travelTime.bis
                : activeRoute.travelTime.en}
          </div>
        )}

        {/* Status bar */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 bg-slate-950/55 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white/90 backdrop-blur-md">
          <span>
            {selectedMunicipality
              ? [
                  language === "fil"
                    ? selectedMunicipality.nameFil
                    : language === "bis"
                      ? selectedMunicipality.nameBis || selectedMunicipality.nameEn
                      : selectedMunicipality.nameEn,
                  selectedMunicipality.description
                    ? ` · ${selectedMunicipality.description}`
                    : "",
                ].join("")
              : pickLang(language, "Camiguin Island", "Isla ng Camiguin", "Isla sa Camiguin")}
          </span>
          <span>
            X {cursorPercent.x.toFixed(1)} · Y {cursorPercent.y.toFixed(1)}
          </span>
          <span>Zoom {zoomLevel.toFixed(2)}×</span>
          <span>Scale ~{(12 / zoomLevel).toFixed(1)} km</span>
        </div>

        <AttractionPopup
          attraction={selected}
          language={language}
          favorite={selectedId ? favorites.includes(selectedId) : false}
          onClose={closeDetail}
          onFavorite={toggleFavorite}
          onShare={shareAttraction}
          onDirections={() => {
            setRouteMode(true);
            if (selectedId) setRouteStart(selectedId);
          }}
          labels={detailLabels}
        />
        <AttractionSidebar
          attraction={selected}
          nearby={nearby}
          language={language}
          favorite={selectedId ? favorites.includes(selectedId) : false}
          onClose={closeDetail}
          onFavorite={toggleFavorite}
          onShare={shareAttraction}
          onDirections={() => {
            setRouteMode(true);
            if (selectedId) setRouteStart(selectedId);
          }}
          onSelectNearby={selectAttraction}
          labels={detailLabels}
        />
        <AttractionBottomSheet
          attraction={selected}
          language={language}
          favorite={selectedId ? favorites.includes(selectedId) : false}
          onClose={closeDetail}
          onFavorite={toggleFavorite}
          onShare={shareAttraction}
          onDirections={() => {
            setRouteMode(true);
            if (selectedId) setRouteStart(selectedId);
          }}
          labels={detailLabels}
        />

        {selectedPlace && (
          <div className="pointer-events-auto absolute right-3 top-20 z-40 w-[min(100%,20rem)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-2 border-b px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-kiosk-green">
                  {selectedPlace.kind === "hotel"
                    ? pickLang(language, "Hotel", "Hotel", "Hotel")
                    : pickLang(language, "Restaurant", "Restawran", "Restawran")}
                </p>
                <h3 className="font-bold text-kiosk-navy">
                  {pickLang(
                    language,
                    selectedPlace.name.en,
                    selectedPlace.name.fil,
                    selectedPlace.name.bis
                  )}
                </h3>
                <p className="text-xs text-slate-500">★ {selectedPlace.rating.toFixed(1)}</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 p-4 text-sm text-slate-600">
              <p>
                {pickLang(
                  language,
                  selectedPlace.description.en,
                  selectedPlace.description.fil,
                  selectedPlace.description.bis
                )}
              </p>
              {selectedPlace.address && (
                <p className="text-xs text-slate-500">{selectedPlace.address}</p>
              )}
              {selectedPlace.openingHours &&
                pickLang(
                  language,
                  selectedPlace.openingHours.en,
                  selectedPlace.openingHours.fil,
                  selectedPlace.openingHours.bis
                ).trim() && (
                  <p className="text-xs">
                    <span className="font-semibold text-kiosk-navy">
                      {detailLabels.hours}:{" "}
                    </span>
                    {pickLang(
                      language,
                      selectedPlace.openingHours.en,
                      selectedPlace.openingHours.fil,
                      selectedPlace.openingHours.bis
                    )}
                  </p>
                )}
              {selectedPlace.phone && (
                <p className="text-xs">{selectedPlace.phone}</p>
              )}
              {selectedPlace.website && (
                <p className="break-all text-xs">{selectedPlace.website}</p>
              )}
            </div>
          </div>
        )}

        {annotationInfo && (
          <div className="pointer-events-auto absolute bottom-14 left-1/2 z-40 w-[min(100%,22rem)] -translate-x-1/2 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="font-bold text-kiosk-navy">{annotationInfo.text}</h3>
              <button
                type="button"
                onClick={() => setAnnotationInfo(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600">{annotationInfo.info}</p>
          </div>
        )}
      </TransformWrapper>
    </div>
  );
}
