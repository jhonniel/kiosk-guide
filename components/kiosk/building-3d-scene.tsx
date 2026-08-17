"use client";

import { useMemo, useRef, useLayoutEffect, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type {
  FloorPlanConfig,
  NavigationGraph,
  NavigationRoute,
  NavNode,
} from "@/features/building-directory/navigation/types";
import {
  WALL_HEIGHT,
  WALL_THICKNESS,
  FLOOR_LAYERS,
  findNode,
  getPlanScale,
  graphHasFloorPlanImages,
  map2DToFloorPlan3D,
  nodeSize,
  nodeSizeForImagePlan,
  routeTo3DPoints,
  type KioskLocationConfig,
} from "@/features/building-directory/navigation/building-3d";
import {
  DestinationCallout,
  HALL_ISO,
  IsometricRoom,
  IsometricWall,
  NavigationBluePath,
  NavigationStartMarker,
} from "@/components/kiosk/building-isometric-nav";
import {
  ImagePlanExtrudedRoom,
  ImagePlanLocationPin,
} from "@/components/kiosk/image-plan-extruded-room";
import { BuildingRoomSelectionPulse } from "@/components/kiosk/building-room-info-callout";
import { RoomScreenTracker } from "@/components/kiosk/room-screen-tracker";

interface Building3DSceneProps {
  graph: NavigationGraph;
  kioskLocation: KioskLocationConfig;
  viewFloor: number;
  highlightLocationId?: string;
  route?: NavigationRoute | null;
  previewRoute?: NavigationRoute | null;
  progress?: number;
  progressRef?: RefObject<number>;
  isNavigating?: boolean;
  hasArrived?: boolean;
  kioskLabel?: string;
  navigationMapMode?: boolean;
  onLocationClick?: (locationId: string) => void;
  selectedNode?: NavNode | null;
  roomOverlayRef?: RefObject<HTMLDivElement | null>;
  roomAnchorPosition?: [number, number, number] | null;
}

const ISO_WALL_H = 0.48;
const STACK_GAP_RATIO = 0.18;

function roomPalette(node: NavNode, highlighted: boolean) {
  if (highlighted) {
    return { wall: "#ca8a04", floor: "#fef9c3", accent: "#eab308" };
  }
  switch (node.type) {
    case "room":
      return { wall: "#94a3b8", floor: "#f1f5f9", accent: "#cbd5e1" };
    case "facility":
      return { wall: "#86efac", floor: "#ecfdf5", accent: "#bbf7d0" };
    case "elevator":
      return { wall: "#a78bfa", floor: "#ede9fe", accent: "#c4b5fd" };
    case "staircase":
      return { wall: "#fdba74", floor: "#fff7ed", accent: "#fed7aa" };
    case "entrance":
      return { wall: "#4ade80", floor: "#dcfce7", accent: "#86efac" };
    case "emergency_exit":
      return { wall: "#f87171", floor: "#fef2f2", accent: "#fca5a5" };
    default:
      return { wall: "#94a3b8", floor: "#f8fafc", accent: "#e2e8f0" };
  }
}

function Wall({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.02} />
    </mesh>
  );
}

function RoomClickTarget({
  width,
  depth,
  onClick,
}: {
  width: number;
  depth: number;
  onClick?: () => void;
}) {
  if (!onClick) return null;

  return (
    <mesh
      position={[0, FLOOR_LAYERS.roomFloorY + 0.04, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function RealisticRoom({
  node,
  graph,
  highlighted,
  onClick,
}: {
  node: NavNode;
  graph: NavigationGraph;
  highlighted: boolean;
  onClick?: () => void;
}) {
  const { w, d, h } = nodeSize(node);
  const pos = map2DToFloorPlan3D(node.x, node.y, graph, node.floor);
  const palette = roomPalette(node, highlighted);
  const wt = WALL_THICKNESS;
  const doorW = Math.min(w * 0.4, 2.2);

  return (
    <group position={[pos.x, 0, pos.z]}>
      <mesh position={[0, FLOOR_LAYERS.roomFloorY, 0]} receiveShadow renderOrder={1}>
        <boxGeometry args={[w - 0.08, 0.02, d - 0.08]} />
        <meshStandardMaterial color={palette.floor} roughness={0.9} depthWrite />
      </mesh>
      <Wall position={[0, FLOOR_LAYERS.roomFloorY + h / 2, -d / 2 + wt / 2]} size={[w, h, wt]} color={palette.wall} />
      <Wall position={[-w / 2 + wt / 2, FLOOR_LAYERS.roomFloorY + h / 2, 0]} size={[wt, h, d]} color={palette.wall} />
      <Wall position={[w / 2 - wt / 2, FLOOR_LAYERS.roomFloorY + h / 2, 0]} size={[wt, h, d]} color={palette.wall} />
      <Wall
        position={[-(w - doorW) / 4 - doorW / 2, FLOOR_LAYERS.roomFloorY + h / 2, d / 2 - wt / 2]}
        size={[(w - doorW) / 2, h, wt]}
        color={palette.wall}
      />
      <Wall
        position={[(w - doorW) / 4 + doorW / 2, FLOOR_LAYERS.roomFloorY + h / 2, d / 2 - wt / 2]}
        size={[(w - doorW) / 2, h, wt]}
        color={palette.wall}
      />
      {highlighted && (
        <mesh position={[0, FLOOR_LAYERS.roomFloorY + 0.02, 0]}>
          <boxGeometry args={[w - 0.2, 0.02, d - 0.2]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#ca8a04"
            emissiveIntensity={0.25}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}
      <Text
        position={[0, FLOOR_LAYERS.roomFloorY + h + 0.15, 0]}
        fontSize={0.38}
        color={highlighted ? "#854d0e" : "#1e3a5f"}
        anchorX="center"
        anchorY="bottom"
        maxWidth={w + 1.5}
        renderOrder={20}
      >
        {node.type === "room" ? node.label.replace("Room ", "R") : node.label}
      </Text>
      <RoomClickTarget width={w} depth={d} onClick={onClick} />
    </group>
  );
}

function KioskSpot({ position, label }: { position: [number, number, number]; label: string }) {
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!pulseRef.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.08;
    pulseRef.current.scale.set(s, 1, s);
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.07, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.06, 1.4]} />
        <meshStandardMaterial color="#bbf7d0" emissive="#22c55e" emissiveIntensity={0.15} roughness={0.8} />
      </mesh>
      <mesh ref={pulseRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.72, 32]} />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.45} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.75, 1.25, 0.5]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.42, 0.14]} castShadow>
        <boxGeometry args={[0.9, 0.85, 0.07]} />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.4} />
      </mesh>
      <Text position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.28} color="#14532d" anchorX="center">
        {label.toUpperCase()}
      </Text>
      <Text position={[0, 2.05, 0]} fontSize={0.48} color="#166534" anchorX="center">
        {label}
      </Text>
    </group>
  );
}

function roomLabel(node: NavNode) {
  return node.type === "room" ? node.label.replace("Room ", "R") : node.label;
}

function getActivePlanOrFirst(graph: NavigationGraph, viewFloor: number): FloorPlanConfig | undefined {
  return graph.floorPlans.find((f) => f.floor === viewFloor) ?? graph.floorPlans[0];
}

function ImagePlan3DSlab({
  plan,
  scale,
  active,
  yOffset,
}: {
  plan: FloorPlanConfig;
  scale: number;
  active: boolean;
  yOffset: number;
}) {
  const texture = useTexture(plan.imageUrl!);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    invalidate();
  }, [texture, invalidate]);

  const slabW = plan.width * scale;
  const slabD = plan.height * scale;
  const inactiveAlpha = active ? 0.92 : 0.35;

  return (
    <group position={[0, yOffset, 0]}>
      {/* Warm mall floor base */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[slabW + 1.5, slabD + 1.5]} />
        <meshStandardMaterial color="#ddd0bc" roughness={0.92} />
      </mesh>

      {/* Floor plan texture */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[slabW, slabD]} />
        <meshBasicMaterial
          map={texture}
          transparent={!active}
          opacity={inactiveAlpha}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function ImageFloorBuilding({ graph, viewFloor }: { graph: NavigationGraph; viewFloor: number }) {
  const scale = getPlanScale(graph, viewFloor);
  const floors = graph.floorPlans.filter((f) => f.imageUrl);
  const stackGap = Math.max(
    ...floors.map((f) => Math.max(f.width * scale, f.height * scale)),
    40
  ) * STACK_GAP_RATIO;

  return (
    <group>
      {floors.map((plan) => {
        const active = plan.floor === viewFloor;
        const yOffset = (plan.floor - viewFloor) * stackGap;
        return (
          <ImagePlan3DSlab
            key={plan.floor}
            plan={plan}
            scale={scale}
            active={active}
            yOffset={yOffset}
          />
        );
      })}
    </group>
  );
}

export function Building3DScene({
  graph,
  kioskLocation,
  viewFloor,
  highlightLocationId,
  route,
  previewRoute,
  progress = 0,
  progressRef,
  isNavigating = false,
  hasArrived = false,
  kioskLabel = "You are here",
  navigationMapMode = false,
  onLocationClick,
  selectedNode,
  roomOverlayRef,
  roomAnchorPosition,
}: Building3DSceneProps) {
  const activeRoute = isNavigating ? route : previewRoute;
  const highlightNode = findNode(graph, highlightLocationId);
  const destNode = highlightNode ?? (activeRoute ? findNode(graph, activeRoute.toLocationId) : undefined);
  const destinationLabel = activeRoute?.destinationName ?? destNode?.label ?? "";
  const imageBased = graphHasFloorPlanImages(graph);

  const floorPlan = graph.floorPlans.find((f) => f.floor === viewFloor);
  const plan = getActivePlanOrFirst(graph, viewFloor);
  const scale = getPlanScale(graph, viewFloor);

  const visibleNodes = useMemo(
    () => graph.nodes.filter((n) => n.floor === viewFloor && n.type !== "intersection"),
    [graph.nodes, viewFloor]
  );

  const routePoints = useMemo((): [number, number, number][] => {
    if (!activeRoute) return [];
    const pts = routeTo3DPoints(activeRoute, graph, viewFloor);
    if (viewFloor === kioskLocation.floor && pts.length > 0) {
      const kiosk = map2DToFloorPlan3D(kioskLocation.x, kioskLocation.y, graph, viewFloor);
      const first = pts[0];
      const dist = Math.hypot(first.x - kiosk.x, first.z - kiosk.z);
      if (dist > 0.5) {
        return [[kiosk.x, 0, kiosk.z], ...pts.map((p) => [p.x, 0, p.z] as [number, number, number])];
      }
    }
    return pts.map((p) => [p.x, 0, p.z] as [number, number, number]);
  }, [activeRoute, graph, viewFloor, kioskLocation]);

  const showKiosk = viewFloor === kioskLocation.floor;
  const kioskPos = useMemo(() => {
    const p = map2DToFloorPlan3D(kioskLocation.x, kioskLocation.y, graph, viewFloor);
    return [p.x, 0, p.z] as [number, number, number];
  }, [graph, kioskLocation, viewFloor]);

  if (!floorPlan || !plan) return null;

  const slabW = plan.width * scale;
  const slabD = plan.height * scale;
  const perimeterH = navigationMapMode ? ISO_WALL_H + 0.15 : WALL_HEIGHT + 0.3;
  const wt = WALL_THICKNESS;

  return (
    <>
      <ambientLight intensity={navigationMapMode ? 0.82 : imageBased ? 0.78 : 0.55} />
      {imageBased ? (
        <>
          <directionalLight position={[24, 38, 18]} intensity={1.05} castShadow={false} />
          <directionalLight position={[-16, 28, -12]} intensity={0.42} />
          <hemisphereLight args={["#fff7ed", "#ddd0bc", 0.55]} />
        </>
      ) : (
        <>
          <directionalLight position={[18, 28, 14]} intensity={navigationMapMode ? 0.9 : 1.15} castShadow={false} />
          <directionalLight position={[-14, 18, -10]} intensity={0.35} />
          {!navigationMapMode && <hemisphereLight args={["#e0f2fe", "#f1f5f9", 0.35]} />}
        </>
      )}

      {imageBased ? (
        <ImageFloorBuilding graph={graph} viewFloor={viewFloor} />
      ) : (
        <>
          <mesh position={[0, FLOOR_LAYERS.slabY, 0]} receiveShadow renderOrder={0}>
            <boxGeometry args={[slabW + 2, FLOOR_LAYERS.slabH, slabD + 2]} />
            <meshStandardMaterial color={navigationMapMode ? "#e5e7eb" : "#b0bec9"} roughness={0.95} depthWrite />
          </mesh>

          {!navigationMapMode &&
            floorPlan.hallways.map((h, i) => {
              const cx = (h.x + h.width / 2 - plan.width / 2) * scale;
              const cz = (h.y + h.height / 2 - plan.height / 2) * scale;
              return (
                <mesh key={i} position={[cx, FLOOR_LAYERS.hallwayY, cz]} receiveShadow renderOrder={1}>
                  <boxGeometry args={[h.width * scale, FLOOR_LAYERS.hallwayH, h.height * scale]} />
                  <meshStandardMaterial color="#d8e2ec" roughness={0.88} depthWrite />
                </mesh>
              );
            })}

          {navigationMapMode &&
            floorPlan.hallways.map((h, i) => {
              const cx = (h.x + h.width / 2 - plan.width / 2) * scale;
              const cz = (h.y + h.height / 2 - plan.height / 2) * scale;
              return (
                <mesh key={i} position={[cx, FLOOR_LAYERS.hallwayY, cz]} renderOrder={1}>
                  <boxGeometry args={[h.width * scale, FLOOR_LAYERS.hallwayH, h.height * scale]} />
                  <meshStandardMaterial color={HALL_ISO} roughness={0.88} depthWrite />
                </mesh>
              );
            })}

          {navigationMapMode ? (
            <>
              <IsometricWall position={[0, perimeterH / 2, -slabD / 2 - wt / 2]} size={[slabW + 2, perimeterH, wt]} />
              <IsometricWall position={[0, perimeterH / 2, slabD / 2 + wt / 2]} size={[slabW + 2, perimeterH, wt]} />
              <IsometricWall position={[-slabW / 2 - wt / 2, perimeterH / 2, 0]} size={[wt, perimeterH, slabD + 2]} />
              <IsometricWall position={[slabW / 2 + wt / 2, perimeterH / 2, 0]} size={[wt, perimeterH, slabD + 2]} />
            </>
          ) : (
            <>
              <Wall position={[0, perimeterH / 2, -slabD / 2 - wt / 2]} size={[slabW + 2, perimeterH, wt]} color="#64748b" />
              <Wall position={[0, perimeterH / 2, slabD / 2 + wt / 2]} size={[slabW + 2, perimeterH, wt]} color="#64748b" />
              <Wall position={[-slabW / 2 - wt / 2, perimeterH / 2, 0]} size={[wt, perimeterH, slabD + 2]} color="#64748b" />
              <Wall position={[slabW / 2 + wt / 2, perimeterH / 2, 0]} size={[wt, perimeterH, slabD + 2]} color="#64748b" />
            </>
          )}
        </>
      )}

      {visibleNodes.map((node) => {
        const highlighted =
          destNode?.id === node.id ||
          (!!highlightLocationId && node.locationId === highlightLocationId);
        const pos = map2DToFloorPlan3D(node.x, node.y, graph, viewFloor);
        const handleClick =
          node.locationId && onLocationClick
            ? () => onLocationClick(node.locationId!)
            : undefined;

        if (imageBased) {
          const { w, d, h } = nodeSizeForImagePlan(node);
          return (
            <ImagePlanExtrudedRoom
              key={node.id}
              node={node}
              position={[pos.x, 0, pos.z]}
              size={[w, h, d]}
              highlighted={highlighted || selectedNode?.id === node.id}
              onClick={handleClick}
            />
          );
        }

        const { w, d } = nodeSize(node);

        if (navigationMapMode) {
          return (
            <IsometricRoom
              key={node.id}
              position={[pos.x, 0, pos.z]}
              size={[w, ISO_WALL_H, d]}
              label={roomLabel(node)}
              highlighted={highlighted}
              onClick={handleClick}
            />
          );
        }

        return (
          <RealisticRoom
            key={node.id}
            node={node}
            graph={graph}
            highlighted={highlighted}
            onClick={handleClick}
          />
        );
      })}

      {showKiosk && imageBased && <ImagePlanLocationPin position={kioskPos} />}
      {showKiosk && !imageBased && !navigationMapMode && <KioskSpot position={kioskPos} label={kioskLabel} />}

      {routePoints.length > 1 && navigationMapMode && (
        <>
          <NavigationBluePath
            points={routePoints}
            progress={isNavigating ? progress : hasArrived ? 1 : 0}
            progressRef={isNavigating ? progressRef : undefined}
            animated={isNavigating && !hasArrived}
            showMovingMarker={isNavigating && !hasArrived}
            variant={imageBased ? "mall" : "blue"}
          />
          {!imageBased && <NavigationStartMarker position={routePoints[0]} label={kioskLabel} />}
          <DestinationCallout position={routePoints[routePoints.length - 1]} label={destinationLabel} />
        </>
      )}

      {selectedNode &&
        selectedNode.floor === viewFloor &&
        !isNavigating &&
        selectedNode.locationId && (
          <BuildingRoomSelectionPulse
            node={selectedNode}
            graph={graph}
            navigationMapMode={navigationMapMode}
          />
        )}

      {roomAnchorPosition && roomOverlayRef && (
        <RoomScreenTracker worldPosition={roomAnchorPosition} overlayRef={roomOverlayRef} />
      )}
    </>
  );
}
