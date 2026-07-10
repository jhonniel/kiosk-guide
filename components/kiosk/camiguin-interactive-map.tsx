"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Landmark,
  Mail,
  MapPin,
  Minus,
  Navigation,
  Phone,
  Plus,
  RotateCcw,
  User,
  X,
} from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLocalizedText } from "@/lib/i18n/translations";
import { uiText } from "@/lib/i18n/kiosk-ui";
import { CAMIGUIN_ISLAND_MAP_SRC } from "@/features/map/camiguin-island";
import { cn } from "@/lib/utils";
import type { MapMarker } from "@/features/map/types";

type MapFilter = "all" | "landmark" | "office" | "municipality";

const MIN_SCALE = 1;
const MAX_SCALE = 2.8;

interface Props {
  markers: MapMarker[];
}

function markerColor(kind: MapMarker["kind"], selected: boolean) {
  if (selected) return "bg-kiosk-navy ring-4 ring-kiosk-green/50";
  switch (kind) {
    case "office":
      return "bg-kiosk-green hover:bg-kiosk-green/90";
    case "landmark":
      return "bg-teal-500 hover:bg-teal-400 ring-2 ring-white/80";
    default:
      return "bg-blue-600 hover:bg-blue-500";
  }
}

function MarkerIcon({ kind }: { kind: MapMarker["kind"] }) {
  if (kind === "office") return <Building2 className="h-4 w-4 text-white" />;
  if (kind === "landmark") return <Landmark className="h-4 w-4 text-white" />;
  return <MapPin className="h-4 w-4 text-white" />;
}

export function CamiguinInteractiveMap({ markers }: Props) {
  const { language } = useKiosk();
  const [filter, setFilter] = useState<MapFilter>("landmark");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return markers;
    return markers.filter((m) => m.kind === filter);
  }, [markers, filter]);

  const touristSpots = useMemo(
    () => markers.filter((m) => m.kind === "landmark"),
    [markers]
  );

  const selected = useMemo(
    () => markers.find((m) => m.id === selectedId) ?? null,
    [markers, selectedId]
  );

  const offices = markers.filter((m) => m.kind === "office");

  function label(marker: MapMarker) {
    return pickLocalizedText(language, marker.nameEn, marker.nameFil, marker.nameBis);
  }

  function description(marker: MapMarker) {
    return pickLocalizedText(
      language,
      marker.descriptionEn,
      marker.descriptionFil,
      marker.descriptionBis
    );
  }

  function location(marker: MapMarker) {
    return pickLocalizedText(language, marker.locationEn, marker.locationFil, marker.locationBis);
  }

  const clampOffset = useCallback((nextScale: number, nextOffset: { x: number; y: number }) => {
    const viewport = viewportRef.current;
    if (!viewport) return nextOffset;
    const maxX = Math.max(0, ((nextScale - 1) * viewport.clientWidth) / 2);
    const maxY = Math.max(0, ((nextScale - 1) * viewport.clientHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
    };
  }, []);

  const zoomToMarker = useCallback(
    (marker: MapMarker) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const nextScale = 1.9;
      const px = (marker.x / 100) * viewport.clientWidth;
      const py = (marker.y / 100) * viewport.clientHeight;
      const cx = viewport.clientWidth / 2;
      const cy = viewport.clientHeight / 2;
      setScale(nextScale);
      setOffset(
        clampOffset(nextScale, {
          x: (cx - px) * nextScale,
          y: (cy - py) * nextScale,
        })
      );
    },
    [clampOffset]
  );

  function selectMarker(marker: MapMarker) {
    setSelectedId(marker.id);
    zoomToMarker(marker);
  }

  function resetView() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function changeScale(delta: number) {
    setScale((prev) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta));
      setOffset((o) => clampOffset(next, o));
      return next;
    });
  }

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-map-marker]")) return;
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset(clampOffset(scale, { x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }));
  }

  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    changeScale(e.deltaY > 0 ? -0.15 : 0.15);
  }

  function touchDistance(touches: React.TouchList) {
    if (touches.length < 2) return 0;
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchRef.current = { distance: touchDistance(e.touches), scale };
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      const distance = touchDistance(e.touches);
      const ratio = distance / pinchRef.current.distance;
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchRef.current.scale * ratio));
      setScale(next);
      setOffset((o) => clampOffset(next, o));
    }
  }

  function onTouchEnd() {
    pinchRef.current = null;
  }

  const filters: { id: MapFilter; labelKey: "mapFilterAll" | "mapFilterTourist" | "mapFilterOffices" | "mapFilterMunicipalities" }[] = [
    { id: "landmark", labelKey: "mapFilterTourist" },
    { id: "all", labelKey: "mapFilterAll" },
    { id: "office", labelKey: "mapFilterOffices" },
    { id: "municipality", labelKey: "mapFilterMunicipalities" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                filter === f.id
                  ? "bg-kiosk-navy text-white shadow-md"
                  : "bg-white text-kiosk-navy ring-1 ring-gray-200 hover:bg-gray-50"
              )}
            >
              {uiText(language, f.labelKey)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changeScale(0.2)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-kiosk-navy shadow-sm ring-1 ring-gray-200"
            aria-label={uiText(language, "mapZoomIn")}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => changeScale(-0.2)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-kiosk-navy shadow-sm ring-1 ring-gray-200"
            aria-label={uiText(language, "mapZoomOut")}
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="flex h-9 items-center gap-1 rounded-lg bg-white px-3 text-xs font-semibold text-kiosk-navy shadow-sm ring-1 ring-gray-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {uiText(language, "mapResetView")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div
          ref={viewportRef}
          className="relative h-[min(68vh,560px)] touch-none overflow-hidden rounded-2xl border border-sky-900/20 bg-sky-950 shadow-xl"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="absolute inset-0 origin-center will-change-transform"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
          >
            <Image
              src={CAMIGUIN_ISLAND_MAP_SRC}
              alt="Camiguin Island map"
              fill
              className="object-contain p-2 select-none"
              priority
              draggable={false}
              unoptimized
            />

            {filtered.map((marker) => {
              const isSelected = selectedId === marker.id;
              return (
                <button
                  key={marker.id}
                  type="button"
                  data-map-marker
                  aria-label={label(marker)}
                  aria-pressed={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelected) {
                      setSelectedId(null);
                      resetView();
                    } else {
                      selectMarker(marker);
                    }
                  }}
                  className={cn(
                    "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg transition-transform",
                    marker.kind === "landmark" ? "h-10 w-10 sm:h-11 sm:w-11" : "h-8 w-8 sm:h-9 sm:w-9",
                    isSelected ? "z-20 scale-125 animate-pulse" : "z-10 hover:scale-110",
                    markerColor(marker.kind, isSelected)
                  )}
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                >
                  <MarkerIcon kind={marker.kind} />
                </button>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-sky-950/50 to-transparent px-4 py-3">
            <p className="text-center text-xs font-medium text-sky-100/90">
              {uiText(language, "mapExploreHint")}
            </p>
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-[10px]">
            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-gray-600 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              {uiText(language, "landmarksLegend")}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-gray-600 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-kiosk-green" />
              {uiText(language, "officesLegend")}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-gray-600 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              {uiText(language, "municipalitiesLegend")}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {selected ? (
            <div className="rounded-2xl border border-kiosk-green/30 bg-white p-5 shadow-md">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-kiosk-green">
                    {selected.kind === "office"
                      ? uiText(language, "governmentOffice")
                      : selected.kind === "landmark"
                        ? uiText(language, "landmarkType")
                        : uiText(language, "municipalityType")}
                  </p>
                  <h3 className="text-lg font-bold text-kiosk-navy">{label(selected)}</h3>
                  {selected.department && (
                    <p className="text-sm text-kiosk-green">{selected.department}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null);
                    resetView();
                  }}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {description(selected) && (
                <p className="mb-4 text-sm leading-relaxed text-gray-600">{description(selected)}</p>
              )}

              <div className="mb-4 space-y-2 rounded-xl bg-kiosk-bg px-4 py-3 text-sm text-gray-700">
                <p className="flex items-start gap-2 font-medium text-kiosk-navy">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-kiosk-green" />
                  {location(selected)}
                </p>
                {selected.headName && (
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    {selected.headName}
                  </p>
                )}
                {selected.contactNumber && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {selected.contactNumber}
                  </p>
                )}
                {selected.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {selected.email}
                  </p>
                )}
              </div>

              {selected.navigationQuery ? (
                <Link
                  href={`/building-directory?q=${encodeURIComponent(selected.navigationQuery)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-kiosk-green px-4 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Navigation className="h-4 w-4" />
                  {uiText(language, "howToGetHere")}
                </Link>
              ) : (
                <p className="text-center text-xs text-gray-500">
                  {uiText(language, "visitLocationHint")}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-center text-sm text-gray-500">
              {uiText(language, "mapTapHint")}
            </div>
          )}

          {touristSpots.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-xs font-bold tracking-wider text-kiosk-navy">
                {uiText(language, "touristSpotsTitle")}
              </h4>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {touristSpots.map((spot) => (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => selectMarker(spot)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      selectedId === spot.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-100 hover:border-teal-200 hover:bg-teal-50/50"
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                      <Landmark className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-kiosk-navy">{label(spot)}</span>
                      <span className="line-clamp-2 text-xs text-gray-500">{description(spot)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {offices.length > 0 && filter !== "landmark" && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h4 className="mb-3 text-xs font-bold tracking-wider text-kiosk-navy">
            {uiText(language, "capitolOffices")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {offices.map((office) => (
              <button
                key={office.id}
                type="button"
                onClick={() => selectMarker(office)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  selectedId === office.id
                    ? "border-kiosk-navy bg-kiosk-navy text-white"
                    : "border-gray-200 bg-white text-kiosk-navy hover:border-kiosk-green hover:bg-green-50"
                )}
              >
                {label(office)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
