"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { Check, Layers, Minus, Plus } from "lucide-react";
import { BuildingArrivalModal, BuildingNavigationHud } from "@/components/kiosk/building-navigation-panel";
import { BuildingOfficeRail } from "@/components/kiosk/building-directory-guide";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { cn } from "@/lib/utils";
import { Building3DScene } from "@/components/kiosk/building-3d-scene";
import { BuildingOrbitCameraFit } from "@/components/kiosk/building-orbit-camera-fit";
import { IsometricNavigationCamera } from "@/components/kiosk/building-isometric-camera";
import { getFloorExtents, graphHasFloorPlanImages } from "@/features/building-directory/navigation/building-3d";
import {
  BuildingRoomInfoCard,
  getRoomAnchorPosition,
} from "@/components/kiosk/building-room-info-callout";
import type { NavigationGraph, NavigationRoute, NavNode } from "@/features/building-directory/navigation/types";
import type { BuildingLocationData } from "@/features/building-directory/types";
import { findNode, type KioskLocationConfig } from "@/features/building-directory/navigation/building-3d";
import { getNodeByLocationId } from "@/features/building-directory/navigation/demo-graph";
import { calculateRoute } from "@/features/building-directory/navigation/routing-engine";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang } from "@/lib/i18n/translations";
import { uiText } from "@/lib/i18n/kiosk-ui";
import { isLowPowerKiosk } from "@/lib/kiosk-performance";

const lowPower = isLowPowerKiosk();

interface Building3DViewerProps {
  graph: NavigationGraph;
  kioskLocation?: KioskLocationConfig;
  currentFloor?: number;
  highlightLocationId?: string;
  route?: NavigationRoute | null;
  progress?: number;
  progressRef?: RefObject<number>;
  isNavigating?: boolean;
  hasArrived?: boolean;
  isDemoMode?: boolean;
  onFloorChange?: (floor: number) => void;
  autoFollowFloor?: boolean;
  onLocationClick?: (locationId: string, floor?: number, label?: string) => void;
  selectedNode?: NavNode | null;
  locations?: BuildingLocationData[];
  onCloseRoomInfo?: () => void;
  onStartNavigation?: (locationId: string, name: string) => void;
  onStopNavigation?: () => void;
  className?: string;
  height?: number;
  /** Fill the parent container height instead of using a fixed viewport cap. */
  fill?: boolean;
  railExtra?: ReactNode;
}

function SceneLoader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e2e8f0" wireframe />
    </mesh>
  );
}

const zoomAnimRef = { id: 0 as number };

function zoomOrbitControls(controls: OrbitControlsImpl | null, factor: number) {
  if (!controls) return;
  const cam = controls.object;
  const startOffset = new Vector3().subVectors(cam.position, controls.target);
  const startDistance = startOffset.length();
  if (!Number.isFinite(startDistance) || startDistance <= 0) return;

  const endDistance = Math.min(
    controls.maxDistance,
    Math.max(controls.minDistance, startDistance * factor)
  );
  if (Math.abs(endDistance - startDistance) < 0.001) return;

  if (zoomAnimRef.id) window.cancelAnimationFrame(zoomAnimRef.id);
  const direction = startOffset.clone().normalize();
  const durationMs = 320;
  const startedAt = performance.now();

  const tick = (now: number) => {
    const t = Math.min(1, (now - startedAt) / durationMs);
    const eased = 1 - Math.pow(1 - t, 3);
    const distance = startDistance + (endDistance - startDistance) * eased;
    cam.position.copy(controls.target).addScaledVector(direction, distance);
    cam.updateProjectionMatrix();
    controls.update();
    if (t < 1) {
      zoomAnimRef.id = window.requestAnimationFrame(tick);
    } else {
      zoomAnimRef.id = 0;
    }
  };
  zoomAnimRef.id = window.requestAnimationFrame(tick);
}

export function Building3DViewer({
  graph,
  kioskLocation: kioskLocationProp,
  currentFloor = 1,
  highlightLocationId,
  route,
  progress = 0,
  progressRef,
  isNavigating = false,
  hasArrived = false,
  isDemoMode = false,
  onFloorChange,
  autoFollowFloor = false,
  onLocationClick,
  selectedNode,
  locations,
  onCloseRoomInfo,
  onStartNavigation,
  onStopNavigation,
  className,
  height = 0,
  fill = false,
  railExtra,
}: Building3DViewerProps) {
  const { language } = useKiosk();
  const focusFloor = currentFloor;
  const kioskLocation = kioskLocationProp ?? {
    floor: 1,
    x: 500,
    y: 360,
    locationId: "gf-kiosk",
    nodeId: "gf_kiosk",
    labelEn: "You are here",
    labelFil: "Nandito ka",
    labelBis: "Ania ka",
  };

  const highlightNode = useMemo(
    () => findNode(graph, highlightLocationId),
    [graph, highlightLocationId]
  );

  const previewRoute = useMemo(() => {
    if (selectedNode || !highlightLocationId || isNavigating) return null;
    const fromNode = getNodeByLocationId(graph, kioskLocation.locationId);
    const toNode = getNodeByLocationId(graph, highlightLocationId);
    if (!fromNode || !toNode) return null;
    if (fromNode.id === toNode.id) return null;
    return calculateRoute(
      graph,
      fromNode.id,
      toNode.id,
      highlightLocationId,
      toNode.label,
      { isDemoMode }
    );
  }, [graph, highlightLocationId, isNavigating, isDemoMode, kioskLocation.locationId, selectedNode]);

  const mapHighlightId = selectedNode?.locationId ?? highlightLocationId;

  const navigationMapMode = isNavigating || !!previewRoute;

  const floorSpan = useMemo(() => {
    const { width, depth } = getFloorExtents(graph, focusFloor);
    return Math.max(width, depth);
  }, [graph, focusFloor]);

  const roomOverlayRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const floorGroupRef = useRef<HTMLDivElement>(null);
  const [floorIndicator, setFloorIndicator] = useState({ x: 0, width: 0 });
  const [floorSlideReady, setFloorSlideReady] = useState(false);

  useLayoutEffect(() => {
    const group = floorGroupRef.current;
    if (!group) return;
    const measure = () => {
      const selected = group.querySelector<HTMLElement>('[aria-checked="true"]');
      if (!selected) return;
      const next = { x: selected.offsetLeft, width: selected.offsetWidth };
      setFloorIndicator((current) => (current.x === next.x && current.width === next.width ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [currentFloor, language, isNavigating]);

  useEffect(() => {
    setFloorSlideReady(true);
  }, []);

  const roomAnchorPosition = useMemo(() => {
    if (!selectedNode || isNavigating || selectedNode.floor !== focusFloor) return null;
    return getRoomAnchorPosition(selectedNode, graph, navigationMapMode);
  }, [selectedNode, isNavigating, focusFloor, graph, navigationMapMode]);

  const handleLocationClick = (locationId: string, floor?: number, label?: string) => {
    const node = getNodeByLocationId(graph, locationId);
    const nextFloor = floor ?? node?.floor;
    if (nextFloor != null && onFloorChange) {
      onFloorChange(nextFloor);
    }
    onLocationClick?.(locationId, floor, label);
  };

  useEffect(() => {
    if (isNavigating) onCloseRoomInfo?.();
  }, [isNavigating, onCloseRoomInfo]);

  useEffect(() => {
    if (isNavigating || autoFollowFloor) return;
    if (highlightNode && onFloorChange) {
      onFloorChange(highlightNode.floor);
    }
  }, [highlightNode, onFloorChange, isNavigating, autoFollowFloor]);

  const floorLabel = graph.floorPlans.find((f) => f.floor === focusFloor)?.label ?? `Floor ${focusFloor}`;
  const imageBased = graphHasFloorPlanImages(graph);
  const imageIsoMode = imageBased;
  const destinationName = route?.destinationName ?? previewRoute?.destinationName ?? "";
  const kioskLabel = pickLang(
    language,
    kioskLocation.labelEn,
    kioskLocation.labelFil,
    kioskLocation.labelBis
  );

  useEffect(() => {
    if (!imageBased) return;
    for (const plan of graph.floorPlans) {
      if (plan.imageUrl) {
        useTexture.preload(plan.imageUrl);
      }
    }
  }, [graph, imageBased]);

  if (!graph.floorPlans.length) {
    return (
      <div className={cn("overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-md", className)}>
        <p className="text-sm font-semibold text-kiosk-navy">Building layout unavailable</p>
        <p className="mt-1 text-xs text-gray-500">
          {pickLang(
            language,
            "No floor plan data is configured yet.",
            "Wala pang naka-configure na floor plan data.",
            "Wala pa na-configure nga floor plan data."
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md",
        fill && "h-full min-h-0",
        className
      )}
    >
      {isDemoMode && !isNavigating && (
        <div className="shrink-0 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-700">
          {imageBased
            ? pickLang(
                language,
                `Viewing ${floorLabel} — uploaded floor plan in 3D. Switch floors on the right.`,
                `Tinitingnan ang ${floorLabel} — naka-upload na floor plan sa 3D. Palitan ang palapag sa kanan.`,
                `Tan-awon ang ${floorLabel} — naka-upload nga floor plan sa 3D. Ilisan ang andana sa tuo.`
              )
            : isNavigating
              ? pickLang(
                  language,
                  "Follow the blue path from your location to the destination",
                  "Sundin ang asul na linya papunta sa destinasyon",
                  "Sunda ang asul nga linya gikan sa imong lokasyon padulong sa destinasyon"
                )
              : navigationMapMode
                ? pickLang(
                    language,
                    "Blue path preview from the kiosk to your selected location",
                    "Preview ng asul na ruta mula sa kiosk",
                    "Preview sa asul nga ruta gikan sa kiosk"
                  )
                : pickLang(
                    language,
                    `Viewing ${floorLabel} — tap a room for details`,
                    `Tinitingnan ang ${floorLabel} — pindutin ang silid para sa detalye`,
                    `Tan-awon ang ${floorLabel} — pindota ang kwarto para sa detalye`
                  )}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
      <div
        style={!fill && height > 0 ? { height } : undefined}
        className={cn(
          "relative min-h-0 min-w-0 flex-1",
          imageBased ? "bg-[#ebe4d8]" : isNavigating ? "bg-gradient-to-b from-[#f0fdf4] to-[#f8fafc]" : "bg-[#f0f4f8]",
          fill
            ? "min-h-[320px]"
            : height <= 0 && (imageBased ? "h-[min(70vh,900px)]" : "h-[min(55vh,720px)]")
        )}
        data-kiosk-zoom-surface
      >
        {locations && locations.length > 0 ? (
          <BuildingOfficeRail
            locations={locations}
            currentFloor={focusFloor}
            activeLocationId={selectedNode?.locationId ?? highlightLocationId}
            onSelectOffice={(locationId, name) => handleLocationClick(locationId, undefined, name)}
          />
        ) : null}
        {selectedNode && !isNavigating && (
          <div
            ref={roomOverlayRef}
            className="pointer-events-auto absolute left-0 top-0 z-[80]"
            style={{ visibility: "hidden" }}
          >
            <BuildingRoomInfoCard
              node={selectedNode}
              locations={locations ?? []}
              onClose={() => onCloseRoomInfo?.()}
              onStartNavigation={onStartNavigation}
            />
          </div>
        )}

        <Canvas
          shadows={false}
          dpr={lowPower ? 1 : [1, 1.5]}
          frameloop={isNavigating ? "always" : "demand"}
          camera={
            imageIsoMode
              ? { position: [55, 65, 55], fov: 32, near: 0.1, far: 500 }
              : { position: [0, 48, 48], fov: 46, near: 0.1, far: 160 }
          }
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: false,
          }}
        >
          <color attach="background" args={[imageBased ? "#ebe4d8" : "#f0f4f8"]} />
          {!navigationMapMode && !imageBased && <fog attach="fog" args={["#e8f0fa", 55, 130]} />}
          <Suspense fallback={<SceneLoader />}>
            <Building3DScene
              graph={graph}
              kioskLocation={kioskLocation}
              viewFloor={focusFloor}
              highlightLocationId={mapHighlightId}
              route={route}
              previewRoute={previewRoute}
              progress={progress}
              progressRef={progressRef}
              isNavigating={isNavigating}
              hasArrived={hasArrived}
              kioskLabel={kioskLabel}
              navigationMapMode={navigationMapMode}
              onLocationClick={handleLocationClick}
              selectedNode={selectedNode}
              roomOverlayRef={roomOverlayRef}
              roomAnchorPosition={roomAnchorPosition}
            />
            {navigationMapMode && !imageIsoMode ? (
              <IsometricNavigationCamera graph={graph} viewFloor={focusFloor} />
            ) : (
              <>
                <OrbitControls
                  ref={controlsRef}
                  makeDefault
                  target={[0, 0, 0]}
                  enablePan
                  enableRotate={!imageIsoMode && !navigationMapMode}
                  enableZoom
                  zoomSpeed={0.55}
                  minDistance={imageIsoMode ? floorSpan * 0.32 : floorSpan * 0.34}
                  maxDistance={imageIsoMode ? floorSpan * 1.85 : floorSpan * 1.55}
                  minPolarAngle={imageIsoMode || navigationMapMode ? Math.atan(1.05) : 0.3}
                  maxPolarAngle={imageIsoMode || navigationMapMode ? Math.atan(1.05) : Math.PI / 2.1}
                  enableDamping
                  dampingFactor={0.12}
                  panSpeed={0.7}
                />
                <BuildingOrbitCameraFit graph={graph} viewFloor={focusFloor} />
              </>
            )}
          </Suspense>
        </Canvas>

        {isNavigating && onStopNavigation && destinationName && (
          <BuildingNavigationHud
            lang={language}
            destinationName={destinationName}
            floorLabel={floorLabel}
            progress={progress}
            distanceMeters={route?.totalDistanceMeters}
            estimatedMinutes={route?.estimatedMinutes}
            onStop={onStopNavigation}
          />
        )}

        {hasArrived && onStopNavigation && destinationName && (
          <BuildingArrivalModal
            lang={language}
            destinationName={destinationName}
            floorLabel={floorLabel}
            onDone={onStopNavigation}
          />
        )}

        {(!navigationMapMode || imageIsoMode) && (
          <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => zoomOrbitControls(controlsRef.current, 0.82)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-kiosk-navy shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95"
              aria-label={uiText(language, "mapZoomIn")}
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => zoomOrbitControls(controlsRef.current, 1.22)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-kiosk-navy shadow-md ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95"
              aria-label={uiText(language, "mapZoomOut")}
            >
              <Minus className="h-5 w-5" />
            </button>
          </div>
        )}

        {!isNavigating && (
          <div className="pointer-events-none absolute top-3 left-64 z-20 flex h-9 w-max items-center gap-2 text-sm text-gray-500">
            {navigationMapMode ? (
              <>
                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-semibold shadow-[0_1px_2px_rgba(15,26,46,0.16)]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#22c55e]" />
                  {pickLang(language, "Start", "Simula", "Sugod")}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-semibold shadow-[0_1px_2px_rgba(15,26,46,0.16)]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#f59e0b]" />
                  {pickLang(language, "Destination", "Destinasyon", "Destinasyon")}
                </span>
              </>
            ) : (
              <>
                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-semibold shadow-[0_1px_2px_rgba(15,26,46,0.16)]">
                  <span className="you-are-here-dot inline-block h-2 w-2" />
                  {kioskLabel}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-semibold shadow-[0_1px_2px_rgba(15,26,46,0.16)]">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#f59e0b]" />
                  {pickLang(language, "Destination", "Destinasyon", "Destinasyon")}
                </span>
              </>
            )}
          </div>
        )}
        <aside className="pointer-events-auto absolute right-3 top-3 z-30 flex items-center gap-2">
          {railExtra ? <div className="w-64 shrink-0">{railExtra}</div> : null}
          <div className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-2 py-2 shadow-[0_8px_24px_rgba(26,39,68,0.10)] ring-1 ring-slate-200/90">
            <div className="flex items-center gap-1.5 px-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400">
                {pickLang(language, "FLOORS", "PALAPAG", "ANDANA")}
              </p>
            </div>
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <div ref={floorGroupRef} className="relative flex items-center gap-0.5" role="radiogroup" aria-label={pickLang(language, "Floors", "Palapag", "Andana")}>
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-y-0 left-0 rounded-lg motion-reduce:transition-none",
                  isNavigating ? "bg-emerald-50" : "bg-blue-50"
                )}
                style={{
                  width: floorIndicator.width,
                  transform: `translateX(${floorIndicator.x}px)`,
                  transition: floorSlideReady
                    ? "transform 420ms cubic-bezier(0.42, 0, 0.58, 1), width 420ms cubic-bezier(0.42, 0, 0.58, 1), background-color 420ms ease"
                    : "none",
                }}
              />
              {[...graph.floorPlans]
                .sort((a, b) => a.floor - b.floor)
                .map((f) => {
                const selected = currentFloor === f.floor;
                const mark = f.floor === 1 ? "G" : String(f.floor);
                return (
                  <button
                    key={f.floor}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={autoFollowFloor}
                    onClick={() => onFloorChange?.(f.floor)}
                    className={cn(
                      "relative z-10 flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-left",
                      !selected && "hover:bg-slate-50",
                      autoFollowFloor && "cursor-default opacity-80"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-500",
                        selected
                          ? isNavigating
                            ? "bg-kiosk-green text-white"
                            : "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {mark}
                    </span>
                    <span className={cn("whitespace-nowrap text-sm font-semibold transition-colors duration-500", selected ? "text-kiosk-navy" : "text-slate-600")}>{f.label}</span>
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <Check
                        className={cn(
                          "h-4 w-4 transition-all duration-500",
                          selected
                            ? cn("scale-100 opacity-100", isNavigating ? "text-kiosk-green" : "text-blue-600")
                            : "scale-75 opacity-0"
                        )}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
      </div>
    </div>
  );
}
