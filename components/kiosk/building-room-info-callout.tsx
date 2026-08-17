"use client";

import { Navigation, X } from "lucide-react";
import { useKiosk } from "@/hooks/use-kiosk";
import { uiText } from "@/lib/i18n/kiosk-ui";
import {
  findLocationById,
  getLocationDisplay,
  getNodeFallbackDisplay,
} from "@/features/building-directory/location-display";
import {
  FLOOR_LAYERS,
  graphHasFloorPlanImages,
  map2DToFloorPlan3D,
  nodeSize,
} from "@/features/building-directory/navigation/building-3d";
import type { BuildingLocationData } from "@/features/building-directory/types";
import type { NavigationGraph, NavNode } from "@/features/building-directory/navigation/types";

const ISO_WALL_H = 0.48;

export function getRoomAnchorPosition(
  node: NavNode,
  graph: NavigationGraph,
  navigationMapMode: boolean
): [number, number, number] {
  const pos = map2DToFloorPlan3D(node.x, node.y, graph, node.floor);
  if (graphHasFloorPlanImages(graph)) {
    return [pos.x, 0.22, pos.z];
  }
  const { h } = nodeSize(node);
  const anchorY = navigationMapMode
    ? FLOOR_LAYERS.roomFloorY + ISO_WALL_H + 0.22
    : FLOOR_LAYERS.roomFloorY + h + 0.28;
  return [pos.x, anchorY, pos.z];
}

interface BuildingRoomInfoCardProps {
  node: NavNode;
  locations: BuildingLocationData[];
  onClose: () => void;
  onStartNavigation?: (locationId: string, name: string) => void;
}

export function BuildingRoomInfoCard({
  node,
  locations,
  onClose,
  onStartNavigation,
}: BuildingRoomInfoCardProps) {
  const { language } = useKiosk();

  const location = findLocationById(locations, node.locationId);
  const display = location
    ? getLocationDisplay(location, language)
    : getNodeFallbackDisplay(node, language);

  const canNavigate = !!onStartNavigation && node.locationId !== "f1-kiosk";

  const floorLine = location?.room
    ? `${uiText(language, "roomLabel")} ${location.room} · ${display.floor}`
    : display.floor;

  return (
    <div
      key={node.id}
      className="room-info-callout-enter pointer-events-auto w-[11.5rem] max-w-[72vw] select-none"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="room-info-callout-float relative rounded-lg border border-[#22c55e]/40 bg-white p-2.5 text-[#1a2744] shadow-lg">
        <div className="absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-[#22c55e]/40 bg-white" />

        <button
          type="button"
          onClick={onClose}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:text-gray-700"
          aria-label="Close"
        >
          <X className="h-3 w-3" />
        </button>

        <h3 className="pr-3 text-xs font-bold leading-snug text-[#1a2744]">{display.name}</h3>
        <p className="mt-0.5 text-[10px] text-gray-600">{floorLine}</p>

        {(location?.nearbyLandmarks?.[0] || display.directions[0]) && (
          <p className="mt-1.5 line-clamp-2 text-[10px] leading-tight text-gray-600">
            {location?.nearbyLandmarks?.[0]
              ? `${uiText(language, "nearLabel")} ${location.nearbyLandmarks[0]}`
              : display.directions[0]}
          </p>
        )}

        {canNavigate && (
          <button
            type="button"
            onClick={() => {
              onStartNavigation!(node.locationId!, display.name);
              onClose();
            }}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-[#22c55e] px-2 py-1.5 text-[10px] font-bold text-white"
          >
            <Navigation className="h-3 w-3" />
            {uiText(language, "directionsButton")}
          </button>
        )}
      </div>
    </div>
  );
}

interface BuildingRoomSelectionPulseProps {
  node: NavNode;
  graph: NavigationGraph;
  navigationMapMode?: boolean;
}

export function BuildingRoomSelectionPulse({
  node,
  graph,
  navigationMapMode = false,
}: BuildingRoomSelectionPulseProps) {
  const pos = map2DToFloorPlan3D(node.x, node.y, graph, node.floor);
  const imageBased = graphHasFloorPlanImages(graph);
  const { w, d } = nodeSize(node);
  const ringY = imageBased ? 0.05 : FLOOR_LAYERS.roomFloorY + 0.05;
  const rx = imageBased ? 0.85 : w * 0.48;
  const rz = imageBased ? 0.85 : d * 0.48;

  return (
    <group position={[pos.x, ringY, pos.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} renderOrder={12}>
        <ringGeometry args={[Math.min(rx, rz) * 0.82, Math.min(rx, rz) * 0.98, 32]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {!navigationMapMode && !imageBased && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} renderOrder={12}>
          <planeGeometry args={[w - 0.1, d - 0.1]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
