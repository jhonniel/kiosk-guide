"use client";

import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { cn } from "@/lib/utils";
import { Building3DScene } from "@/components/kiosk/building-3d-scene";
import { IsometricNavigationCamera } from "@/components/kiosk/building-isometric-camera";
import { BuildingOrbitCameraFit } from "@/components/kiosk/building-orbit-camera-fit";
import { getFloorExtents } from "@/features/building-directory/navigation/building-3d";
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
  onLocationClick?: (locationId: string) => void;
  selectedNode?: NavNode | null;
  locations?: BuildingLocationData[];
  onCloseRoomInfo?: () => void;
  onStartNavigation?: (locationId: string, name: string) => void;
  className?: string;
  height?: number;
}

function SceneLoader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e2e8f0" wireframe />
    </mesh>
  );
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
  className,
  height = 480,
}: Building3DViewerProps) {
  const { language } = useKiosk();
  const focusFloor = currentFloor;
  const kioskLocation = kioskLocationProp ?? {
    floor: 1,
    x: 105,
    y: 200,
    locationId: "f1-kiosk",
    nodeId: "f1_kiosk",
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

  const roomAnchorPosition = useMemo(() => {
    if (!selectedNode || isNavigating || selectedNode.floor !== focusFloor) return null;
    return getRoomAnchorPosition(selectedNode, graph, navigationMapMode);
  }, [selectedNode, isNavigating, focusFloor, graph, navigationMapMode]);

  const handleLocationClick = (locationId: string) => {
    const node = getNodeByLocationId(graph, locationId);
    if (node && onFloorChange) {
      onFloorChange(node.floor);
    }
    onLocationClick?.(locationId);
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
  const kioskLabel = pickLang(
    language,
    kioskLocation.labelEn,
    kioskLocation.labelFil,
    kioskLocation.labelBis
  );

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
    <div className={cn("overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md", className)}>
      <div className="flex items-center justify-between border-b bg-kiosk-bg px-4 py-2">
        <div className="flex gap-1">
          {graph.floorPlans.map((f) => (
            <button
              key={f.floor}
              type="button"
              disabled={autoFollowFloor}
              onClick={() => onFloorChange?.(f.floor)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                currentFloor === f.floor
                  ? "bg-kiosk-navy text-white"
                  : "bg-white text-kiosk-navy hover:bg-gray-100",
                autoFollowFloor && "cursor-default opacity-80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="hidden text-[10px] text-gray-500 sm:block">
          {autoFollowFloor
            ? pickLang(language, "Following route…", "Sinusundan ang ruta…", "Ginasunod ang ruta…")
            : navigationMapMode
              ? pickLang(language, "Navigation map", "Mapa ng navigation", "Mapa sa navigation")
              : `${floorLabel} · Drag to rotate`}
        </p>
      </div>

      {isDemoMode && (
        <div className="bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-700">
          {isNavigating
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

      <div style={{ height }} className="relative bg-[#f0f4f8]">
        {selectedNode && !isNavigating && (
          <div
            ref={roomOverlayRef}
            className="pointer-events-auto absolute left-0 top-0 z-20"
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
          shadows={!navigationMapMode}
          dpr={[1, 1.5]}
          frameloop="always"
          camera={navigationMapMode ? undefined : { position: [0, 40, 40], fov: 44, near: 0.1, far: 160 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            logarithmicDepthBuffer: true,
          }}
        >
          <color attach="background" args={["#f0f4f8"]} />
          {!navigationMapMode && <fog attach="fog" args={["#e8f0fa", 55, 130]} />}
          <Suspense fallback={<SceneLoader />}>
            {navigationMapMode && (
              <IsometricNavigationCamera graph={graph} viewFloor={focusFloor} />
            )}
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
            {!navigationMapMode && (
              <>
                <OrbitControls
                  makeDefault
                  target={[0, 0, 0]}
                  enablePan
                  minDistance={floorSpan * 0.45}
                  maxDistance={floorSpan * 1.65}
                  minPolarAngle={0.35}
                  maxPolarAngle={Math.PI / 2.15}
                  enableDamping
                  dampingFactor={0.08}
                />
                <BuildingOrbitCameraFit graph={graph} viewFloor={focusFloor} />
              </>
            )}
          </Suspense>
        </Canvas>

        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-[10px] text-gray-500">
          {navigationMapMode ? (
            <>
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-[#2563eb]" />
                {pickLang(language, "Start", "Simula", "Sugod")}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm">
                <span className="inline-block h-2 w-2 rounded-full bg-[#eab308]" />
                {pickLang(language, "End", "Destinasyon", "Katapusan")}
              </span>
              {isNavigating && (
                <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#3b82f6]" />
                  {pickLang(language, "You", "Ikaw", "Ikaw")}
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-[#2563eb]" />
              {kioskLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
