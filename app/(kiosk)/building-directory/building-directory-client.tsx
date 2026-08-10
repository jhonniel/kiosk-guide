"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { MapPin, Phone } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { localized, pickLang } from "@/lib/i18n/translations";
import { ContentCard } from "@/components/kiosk/content-card";
import { BuildingDirectoryGuide } from "@/components/kiosk/building-directory-guide";
import { BuildingLayoutPanel } from "@/components/kiosk/building-layout-panel";
import { BuildingNavigationPanel } from "@/components/kiosk/building-navigation-panel";
import { IndoorKioskMap } from "@/components/indoor-map/indoor-kiosk-map";
import { useBuildingNavigation } from "@/hooks/use-building-navigation";
import { pickBuildingUiConfig } from "@/features/building-directory/page-data";
import { getNodeByLocationId } from "@/features/building-directory/navigation/demo-graph";
import type { BuildingUiConfig } from "@/features/settings/building-config";
import type { BuildingLocationData } from "@/features/building-directory/types";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import type { PublishedIndoorPayload } from "@/features/indoor-map/types";
import type { Directory } from "@prisma/client";

interface BuildingDirectoryClientProps {
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

export function BuildingDirectoryClient({
  directories,
  isDemoMode,
  buildingName,
  showOfficialDirectory,
  navigationGraph,
  locations,
  uiConfigEn,
  uiConfigFil,
  uiConfigBis,
  indoorMap = null,
  indoorMapV2 = false,
  initialQuery,
}: BuildingDirectoryClientProps) {
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
    <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
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

      {showOfficialDirectory && (
        <div className="min-h-0 shrink-0 overflow-y-auto border-t border-gray-200 pt-3">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-sm font-bold tracking-wider text-kiosk-navy">
              {pickLang(language, "OFFICIAL DIRECTORY", "OPISYAL NA DIREKTORYO", "OPISYAL NGA DIREKTORYO")}
            </h2>
            <div className="h-0.5 w-8 bg-kiosk-green" />
          </div>
          <div className="kiosk-stagger grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {directories.map((dir) => (
              <ContentCard key={dir.id}>
                <h3 className="mb-2 font-bold text-kiosk-navy">{localized(dir, language, "name")}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {dir.building && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-kiosk-green" />
                      {dir.building} — {dir.floor}, Room {dir.room}
                    </p>
                  )}
                  {dir.contactNumber && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-kiosk-green" />
                      {dir.contactNumber}
                    </p>
                  )}
                </div>
              </ContentCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
