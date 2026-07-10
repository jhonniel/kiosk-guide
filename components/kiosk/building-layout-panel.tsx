"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Building3DViewerLazy } from "@/components/kiosk/building-3d-viewer-lazy";
import type { NavigationGraph, NavigationRoute, NavNode } from "@/features/building-directory/navigation/types";
import type { BuildingLocationData } from "@/features/building-directory/types";
import type { BuildingUiConfig } from "@/features/settings/building-config";
import { useKiosk } from "@/hooks/use-kiosk";
import { uiText } from "@/lib/i18n/kiosk-ui";
import type { RefObject } from "react";

interface BuildingLayoutPanelProps {
  buildingName: string;
  isDemoMode: boolean;
  navigationGraph: NavigationGraph;
  locations: BuildingLocationData[];
  kioskLocation: BuildingUiConfig["kioskLocation"];
  highlightLocationId?: string | null;
  pickedNode?: NavNode | null;
  onLocationClick?: (locationId: string) => void;
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
}

export function BuildingLayoutPanel({
  buildingName,
  isDemoMode,
  navigationGraph,
  locations,
  kioskLocation,
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
}: BuildingLayoutPanelProps) {
  const { language } = useKiosk();
  const [localFloor, setLocalFloor] = useState(1);

  const currentFloor = controlledFloor ?? localFloor;
  const onFloorChange = controlledOnFloorChange ?? setLocalFloor;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
            <Building2 className="h-5 w-5 text-kiosk-green" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-kiosk-navy">
              {uiText(language, "buildingLayoutTitle")}
            </h2>
            <p className="text-xs text-gray-500">{buildingName}</p>
          </div>
        </div>
        <p className="hidden text-[10px] text-gray-500 sm:block">
          {uiText(language, "tapRoomHint")}
        </p>
      </div>

      <Building3DViewerLazy
        graph={navigationGraph}
        kioskLocation={kioskLocation}
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
        height={480}
      />
    </div>
  );
}
