"use client";

import { useSearchParams } from "next/navigation";
import { BuildingDirectoryClient } from "./building-directory-client";
import type { BuildingUiConfig } from "@/features/settings/building-config";
import type { BuildingLocationData } from "@/features/building-directory/types";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import type { PublishedIndoorPayload } from "@/features/indoor-map/types";
import type { Directory } from "@prisma/client";

interface Props {
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
}

export function BuildingDirectoryPageClient(props: Props) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? undefined;

  return <BuildingDirectoryClient {...props} initialQuery={initialQuery} />;
}
