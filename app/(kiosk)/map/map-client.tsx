"use client";

import { CamiguinInteractiveMap } from "@/components/kiosk/camiguin-interactive-map";
import type { MapMarker } from "@/features/map/types";

interface MapClientProps {
  markers: MapMarker[];
}

export function MapClient({ markers }: MapClientProps) {
  return <CamiguinInteractiveMap markers={markers} />;
}
