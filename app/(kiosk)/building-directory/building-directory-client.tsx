"use client";

import dynamic from "next/dynamic";
import { BuildingDirectoryComingSoon } from "@/components/kiosk/building-directory-coming-soon";
import { BUILDING_3D_MAP_ENABLED } from "@/features/building-directory/feature-flags";
import type { BuildingUiConfig } from "@/features/settings/building-config";
import type { BuildingLocationData } from "@/features/building-directory/types";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import type { PublishedIndoorPayload } from "@/features/indoor-map/types";
import type { Directory } from "@prisma/client";

const BuildingDirectoryInteractive = dynamic(
  () =>
    import("./building-directory-interactive").then((module) => ({
      default: module.BuildingDirectoryInteractive,
    })),
  { ssr: false }
);

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

export function BuildingDirectoryClient(props: BuildingDirectoryClientProps) {
  const { buildingName } = props;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-4">
      {BUILDING_3D_MAP_ENABLED ? (
        <BuildingDirectoryInteractive {...props} />
      ) : (
        <BuildingDirectoryComingSoon buildingName={buildingName} />
      )}
    </div>
  );
}
