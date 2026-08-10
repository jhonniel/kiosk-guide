"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Building3DViewerLazy } from "@/components/kiosk/building-3d-viewer-lazy";
import { graphHasFloorPlanImages } from "@/features/building-directory/navigation/building-3d";
import type { NavigationGraph, NavigationRoute, NavNode } from "@/features/building-directory/navigation/types";
import type { BuildingLocationData } from "@/features/building-directory/types";
import type { BuildingUiConfig } from "@/features/settings/building-config";
import { useKiosk } from "@/hooks/use-kiosk";
import { pickLang } from "@/lib/i18n/translations";
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
  const imageBased = graphHasFloorPlanImages(navigationGraph);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3 sm:mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 sm:h-10 sm:w-10">
            <Building2 className="h-4 w-4 text-kiosk-green sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-kiosk-navy">
              {imageBased
                ? pickLang(language, "3D BUILDING NAVIGATION", "3D NAVIGATION NG GUSALI", "3D NAVIGATION SA BUILDING")
                : uiText(language, "buildingLayoutTitle")}
            </h2>
            <p className="text-xs text-gray-500">{buildingName}</p>
          </div>
        </div>
        <p className="hidden text-[10px] text-gray-500 sm:block">
          {imageBased
            ? pickLang(
                language,
                "Drag to orbit · Switch floors · Your uploaded floor plans in 3D",
                "I-drag para i-orbit · Palitan ang palapag · Floor plan mo sa 3D",
                "I-drag aron i-orbit · Ilisan ang andana · Imong floor plan sa 3D"
              )
            : uiText(language, "tapRoomHint")}
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
        fill
        className="min-h-0 flex-1"
      />
    </div>
  );
}
