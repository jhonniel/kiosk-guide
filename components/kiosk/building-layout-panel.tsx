"use client";

import { useState } from "react";
import { Building3DViewerLazy } from "@/components/kiosk/building-3d-viewer-lazy";
import type { NavigationGraph, NavigationRoute, NavNode } from "@/features/building-directory/navigation/types";
import type { BuildingLocationData } from "@/features/building-directory/types";
import type { BuildingUiConfig } from "@/features/settings/building-config";
import type { RefObject, ReactNode } from "react";

interface BuildingLayoutPanelProps {
  buildingName: string;
  isDemoMode: boolean;
  navigationGraph: NavigationGraph;
  locations: BuildingLocationData[];
  kioskLocation: BuildingUiConfig["kioskLocation"];
  /** Top-down floor plan instead of the tilted 3D view. */
  flatView?: boolean;
  /** Shows the 2D / 3D switch on the map when provided. */
  onFlatViewChange?: (flat: boolean) => void;
  highlightLocationId?: string | null;
  pickedNode?: NavNode | null;
  onLocationClick?: (locationId: string, floor?: number, label?: string) => void;
  onCloseLocationInfo?: () => void;
  onStartNavigation?: (locationId: string, name: string) => void;
  route?: NavigationRoute | null;
  progress?: number;
  progressRef?: RefObject<number>;
  isNavigating?: boolean;
  hasArrived?: boolean;
  currentFloor?: number;
  onFloorChange?: (floor: number) => void;
  autoFollowFloor?: boolean;
  onStopNavigation?: () => void;
  railExtra?: ReactNode;
}

export function BuildingLayoutPanel({
  isDemoMode,
  navigationGraph,
  locations,
  kioskLocation,
  flatView = false,
  onFlatViewChange,
  highlightLocationId,
  pickedNode,
  onLocationClick,
  onCloseLocationInfo,
  onStartNavigation,
  route = null,
  progress = 0,
  progressRef,
  isNavigating = false,
  hasArrived = false,
  currentFloor: controlledFloor,
  onFloorChange: controlledOnFloorChange,
  autoFollowFloor = false,
  onStopNavigation,
  railExtra,
}: BuildingLayoutPanelProps) {
  const [localFloor, setLocalFloor] = useState(1);

  const currentFloor = controlledFloor ?? localFloor;
  const onFloorChange = controlledOnFloorChange ?? setLocalFloor;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Building3DViewerLazy
        graph={navigationGraph}
        kioskLocation={kioskLocation}
        flatView={flatView}
        onFlatViewChange={onFlatViewChange}
        currentFloor={currentFloor}
        highlightLocationId={highlightLocationId ?? undefined}
        onLocationClick={onLocationClick}
        selectedNode={!isNavigating ? pickedNode : null}
        locations={locations}
        onCloseRoomInfo={onCloseLocationInfo}
        onStartNavigation={onStartNavigation}
        route={route}
        progress={progress}
        progressRef={progressRef}
        isNavigating={isNavigating}
        hasArrived={hasArrived}
        isDemoMode={isDemoMode}
        onFloorChange={onFloorChange}
        autoFollowFloor={autoFollowFloor}
        onStopNavigation={onStopNavigation}
        fill
        className="min-h-0 flex-1"
        railExtra={railExtra}
      />
    </div>
  );
}
