"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BuildingDirectoryGuide } from "@/components/kiosk/building-directory-guide";
import { BuildingLayoutPanel } from "@/components/kiosk/building-layout-panel";
import { BuildingNavigationPanel } from "@/components/kiosk/building-navigation-panel";
import { IndoorKioskMap } from "@/components/indoor-map/indoor-kiosk-map";
import { useBuildingNavigation } from "@/hooks/use-building-navigation";
import { pickBuildingUiConfig } from "@/features/building-directory/page-data";
import { getNodeByLocationId } from "@/features/building-directory/navigation/demo-graph";
import { useKiosk } from "@/hooks/use-kiosk";
import type { BuildingUiConfig } from "@/features/settings/building-config";
import type { BuildingLocationData } from "@/features/building-directory/types";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import type { PublishedIndoorPayload } from "@/features/indoor-map/types";
import type { Directory } from "@prisma/client";

interface BuildingDirectoryInteractiveProps {
  directories: Directory[];
  isDemoMode: boolean;
  buildingName: string;
  showOfficialDirectory: boolean;
  navigationGraph: NavigationGraph;
  locations: BuildingLocationData[];
  uiConfigEn: BuildingUiConfig;
  uiConfigFil: BuildingUiConfig;
  uiConfigBis: BuildingUiConfig;
  indoorMap?: PublishedIndoorPayload | null;
  indoorMapV2?: boolean;
  initialQuery?: string;
}

interface NavTarget {
  locationId: string;
  name: string;
  accessible: boolean;
}

export function BuildingDirectoryInteractive({
  isDemoMode,
  buildingName,
  navigationGraph,
  locations,
  uiConfigEn,
  uiConfigFil,
  uiConfigBis,
  indoorMap = null,
  indoorMapV2 = false,
  initialQuery,
}: BuildingDirectoryInteractiveProps) {
  const { language } = useKiosk();
  const uiConfig = pickBuildingUiConfig(uiConfigEn, uiConfigFil, uiConfigBis, language);
  const [highlightLocationId, setHighlightLocationId] = useState<string | null>(null);
  const [pickedLocationId, setPickedLocationId] = useState<string | null>(null);
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null);
  const navStartedRef = useRef<string | null>(null);

  const useLeafletIndoor =
    indoorMapV2 &&
    indoorMap &&
    indoorMap.buildings.some((b) => b.floors.length > 0) &&
    !navigationGraph.floorPlans.some((f) => Boolean(f.imageUrl));

  const pickedNode = useMemo(() => {
    if (!pickedLocationId) return null;
    return getNodeByLocationId(navigationGraph, pickedLocationId) ?? null;
  }, [pickedLocationId, navigationGraph]);

  const handleLocationClick = useCallback((locationId: string) => {
    setPickedLocationId(locationId);
  }, []);

  const nav = useBuildingNavigation({
    graph: navigationGraph,
    accessible: navTarget?.accessible ?? false,
    lang: language,
  });

  const { startNavigation, cancel, route, progress, progressRef, currentFloor, setCurrentFloor, status } = nav;

  const handleStartNavigation = useCallback(
    (locationId: string, name: string, accessible: boolean) => {
      setHighlightLocationId(locationId);
      setNavTarget({ locationId, name, accessible });
    },
    []
  );

  const handleCloseNavigation = useCallback(() => {
    cancel();
    setNavTarget(null);
    navStartedRef.current = null;
  }, [cancel]);

  useEffect(() => {
    if (!navTarget) return;
    if (navStartedRef.current === navTarget.locationId) return;
    navStartedRef.current = navTarget.locationId;
    void startNavigation(navTarget.locationId);
  }, [navTarget, startNavigation]);

  const isNavigating = status === "navigating" || status === "paused";
  const hasArrived = status === "arrived";
  const showLayout = !useLeafletIndoor && navigationGraph.floorPlans.length > 0;

  return (
    <>
      {!useLeafletIndoor && (
        <div className="shrink-0">
          <BuildingDirectoryGuide
            isDemoMode={isDemoMode}
            uiConfig={uiConfig}
            initialQuery={initialQuery}
            onLocationHighlight={setHighlightLocationId}
            onStartNavigation={handleStartNavigation}
            navigationActive={!!navTarget}
          />
        </div>
      )}

      {useLeafletIndoor && indoorMap ? (
        <div className="min-h-0 flex-1">
          <IndoorKioskMap payload={indoorMap} buildingName={buildingName} />
        </div>
      ) : null}

      {showLayout && (
        <div className="min-h-0 flex-1">
          <BuildingLayoutPanel
            buildingName={buildingName}
            isDemoMode={isDemoMode}
            navigationGraph={navigationGraph}
            locations={locations}
            kioskLocation={uiConfig.kioskLocation}
            highlightLocationId={highlightLocationId}
            pickedNode={pickedNode}
            onLocationClick={handleLocationClick}
            onCloseLocationInfo={() => {
              setPickedLocationId(null);
              if (!navTarget) setHighlightLocationId(null);
            }}
            onStartNavigation={(locationId, name) =>
              handleStartNavigation(locationId, name, false)
            }
            route={route}
            progress={progress}
            progressRef={progressRef}
            isNavigating={isNavigating}
            hasArrived={hasArrived}
            currentFloor={currentFloor}
            onFloorChange={setCurrentFloor}
            autoFollowFloor={isNavigating}
          />
        </div>
      )}

      {navTarget && (
        <div className="shrink-0">
          <BuildingNavigationPanel
            nav={nav}
            destinationName={navTarget.name}
            lang={language}
            onClose={handleCloseNavigation}
          />
        </div>
      )}
    </>
  );
}
