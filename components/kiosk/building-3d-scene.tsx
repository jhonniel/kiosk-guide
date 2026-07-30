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
/** Story height between stacked floor-plan slabs (3D navigation building). */
/** Proportional constants for the architectural cutaway model. */
const WALL_H_RATIO = 0.12;
const WALL_T_RATIO = 0.012;
const SLAB_T_RATIO = 0.012;
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

/**
 * Interior wall segments for the Proposed Camiguin Capitol.
 * Coordinates are normalized 0..1 (x = left-right, y = top-bottom of the floor plan).
 * Grid: columns A(0)..K(1.0) with 10 bays of 8m = 80m total.
 *        rows 1(0)..9(1.0) with 8 sections ≈ 68m total.
 * Each segment: [x1, y1, x2, y2]  — a straight wall from (x1,y1) to (x2,y2).
 */
type WallSeg = [number, number, number, number];

const COL_A = 0.0, COL_B = 0.1, COL_C = 0.2, COL_D = 0.3, COL_E = 0.4;
const COL_F = 0.5, COL_G = 0.6, COL_H = 0.7, COL_I = 0.8, COL_J = 0.9, COL_K = 1.0;
const ROW_1 = 0.0, ROW_2 = 0.125, ROW_3 = 0.25;
const ROW_4 = 0.375, ROW_5 = 0.5, ROW_6 = 0.625;
const ROW_7 = 0.75, ROW_8 = 0.875, ROW_9 = 1.0;

function getCapitolWalls(_floor: number): WallSeg[] {
  const walls: WallSeg[] = [];

  // --- Horizontal structural walls (row lines running left-right) ---
  // Row 1 top perimeter — already handled by perimeter box
  // Row 3 corridor (between upper offices and hallway)
  walls.push([COL_A, ROW_3, COL_K, ROW_3]);
  // Row 4 corridor south side
  walls.push([COL_A, ROW_4, COL_K, ROW_4]);
  // Row 6 corridor (between lower offices and hallway)
  walls.push([COL_A, ROW_6, COL_B, ROW_6]);
  walls.push([COL_J, ROW_6, COL_K, ROW_6]);
  // Row 7 — lower office divider
  walls.push([COL_A, ROW_7, COL_B, ROW_7]);
  walls.push([COL_J, ROW_7, COL_K, ROW_7]);

  // Concourse area horizontal walls
  walls.push([COL_B, ROW_6, COL_D, ROW_6]);
  walls.push([COL_H, ROW_6, COL_J, ROW_6]);

  // Lower wing horizontal walls
  walls.push([COL_B, ROW_7, COL_E, ROW_7]);
  walls.push([COL_G, ROW_7, COL_J, ROW_7]);

  // --- Vertical structural walls (column lines running top-bottom) ---
  // Column B — left wing separator
  walls.push([COL_B, ROW_1, COL_B, ROW_3]);
  walls.push([COL_B, ROW_4, COL_B, ROW_9]);

  // Column C
  walls.push([COL_C, ROW_1, COL_C, ROW_3]);
  walls.push([COL_C, ROW_7, COL_C, ROW_9]);

  // Column D
  walls.push([COL_D, ROW_1, COL_D, ROW_3]);
  walls.push([COL_D, ROW_6, COL_D, ROW_9]);

  // Column E
  walls.push([COL_E, ROW_1, COL_E, ROW_3]);
  walls.push([COL_E, ROW_7, COL_E, ROW_9]);

  // Column F
  walls.push([COL_F, ROW_1, COL_F, ROW_3]);
  walls.push([COL_F, ROW_7, COL_F, ROW_9]);

  // Column G
  walls.push([COL_G, ROW_1, COL_G, ROW_3]);
  walls.push([COL_G, ROW_7, COL_G, ROW_9]);

  // Column H
  walls.push([COL_H, ROW_1, COL_H, ROW_3]);
  walls.push([COL_H, ROW_6, COL_H, ROW_9]);

  // Column I
  walls.push([COL_I, ROW_1, COL_I, ROW_3]);
  walls.push([COL_I, ROW_7, COL_I, ROW_9]);

  // Column J — right wing separator
  walls.push([COL_J, ROW_1, COL_J, ROW_3]);
  walls.push([COL_J, ROW_4, COL_J, ROW_9]);

  // --- Interior room dividers (upper wing, rows 1-3) ---
  // Horizontal mid-dividers in upper offices
  walls.push([COL_A, ROW_2, COL_B, ROW_2]);
  walls.push([COL_B, ROW_2, COL_C, ROW_2]);
  walls.push([COL_I, ROW_2, COL_J, ROW_2]);
  walls.push([COL_J, ROW_2, COL_K, ROW_2]);

  // --- Interior room dividers (lower wing, rows 6-9) ---
  walls.push([COL_B, ROW_8, COL_E, ROW_8]);
  walls.push([COL_G, ROW_8, COL_J, ROW_8]);

  // Left wing lower section vertical dividers
  walls.push([COL_C, ROW_4, COL_C, ROW_6]);
  walls.push([COL_D, ROW_4, COL_D, ROW_6]);

  // Right wing lower section vertical dividers
  walls.push([COL_H, ROW_4, COL_H, ROW_6]);
  walls.push([COL_I, ROW_4, COL_I, ROW_6]);

  // Concourse perimeter (the U-shaped inner courtyard walls)
  walls.push([COL_D, ROW_6, COL_D, ROW_7]);
  walls.push([COL_H, ROW_6, COL_H, ROW_7]);
  walls.push([COL_D, ROW_7, COL_H, ROW_7]);

  // Row 5 horizontal walls for bay area dividers
  walls.push([COL_A, ROW_5, COL_C, ROW_5]);
  walls.push([COL_I, ROW_5, COL_K, ROW_5]);

  return walls;
}

function InteriorWalls({
  slabW,
  slabD,
  wallH,
  wt,
  floor,
  active,
}: {
  slabW: number;
  slabD: number;
  wallH: number;
  wt: number;
  floor: number;
  active: boolean;
}) {
  const segments = useMemo(() => getCapitolWalls(floor), [floor]);
  const interiorWallH = wallH * 0.85;
  const interiorWt = wt * 0.7;
  const color = active ? "#d1d5db" : "#c8cdd4";
  const alpha = active ? 1 : 0.25;

  return (
    <>
      {segments.map((seg, i) => {
        const [x1n, y1n, x2n, y2n] = seg;
        const x1 = (x1n - 0.5) * slabW;
        const z1 = (y1n - 0.5) * slabD;
        const x2 = (x2n - 0.5) * slabW;
        const z2 = (y2n - 0.5) * slabD;
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.hypot(dx, dz);
        if (len < 0.01) return null;

        const cx = (x1 + x2) / 2;
        const cz = (z1 + z2) / 2;
        const angle = Math.atan2(dx, dz);
        const isHorizontal = Math.abs(dz) < 0.01;

        return (
          <mesh
            key={i}
            position={[cx, interiorWallH / 2, cz]}
            rotation={[0, angle, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry
              args={[
                interiorWt,
                interiorWallH,
                len + (isHorizontal ? 0 : interiorWt),
              ]}
            />
            <meshStandardMaterial
              color={color}
              roughness={0.85}
              transparent={!active}
              opacity={alpha}
            />
          </mesh>
        );
      })}
    </>
  );
}

function TexturedFloorSlab({
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
  const span = Math.max(slabW, slabD);
  const wallH = span * WALL_H_RATIO;
  const wt = Math.max(span * WALL_T_RATIO, 0.3);
  const slabT = Math.max(span * SLAB_T_RATIO, 0.25);
  const wallColor = active ? "#e8ecf0" : "#d4dae3";
  const deckColor = active ? "#f8fafc" : "#e2e8f0";
  const inactiveAlpha = 0.3;

  return (
    <group position={[0, yOffset, 0]}>
      {/* Structural deck / floor slab — U-shaped */}
      {(() => {
        const halfW = slabW / 2;
        const halfD = slabD / 2;
        const cLeft = (COL_D - 0.5) * slabW;
        const cRight = (COL_H - 0.5) * slabW;
        const cTop = (ROW_7 - 0.5) * slabD;
        const upperH = cTop + halfD;
        const wingW = cLeft + halfW;
        const wingRW = halfW - cRight;
        const wingD = halfD - cTop;
        const deckMat = (
          <meshStandardMaterial color={deckColor} roughness={0.85} transparent={!active} opacity={active ? 1 : inactiveAlpha} />
        );
        return (
          <>
            {/* Upper portion: full width, rows 1 to 7 */}
            <mesh position={[0, -slabT / 2, (-halfD + cTop) / 2]} receiveShadow castShadow>
              <boxGeometry args={[slabW + wt * 2, slabT, upperH + wt]} />
              {deckMat}
            </mesh>
            {/* Left wing: A-D, rows 7-9 */}
            <mesh position={[(-halfW + cLeft) / 2, -slabT / 2, (cTop + halfD) / 2]} receiveShadow castShadow>
              <boxGeometry args={[wingW + wt, slabT, wingD + wt]} />
              {deckMat}
            </mesh>
            {/* Right wing: H-K, rows 7-9 */}
            <mesh position={[(cRight + halfW) / 2, -slabT / 2, (cTop + halfD) / 2]} receiveShadow castShadow>
              <boxGeometry args={[wingRW + wt, slabT, wingD + wt]} />
              {deckMat}
            </mesh>
          </>
        );
      })()}

      {/* Floor plan texture on top of the slab */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[slabW, slabD]} />
        <meshBasicMaterial
          map={texture}
          transparent={!active}
          opacity={active ? 1 : 0.4}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Perimeter walls — U-shaped building with concourse cutout */}
      {(() => {
        const mat = <meshStandardMaterial color={wallColor} roughness={0.8} transparent={!active} opacity={active ? 1 : inactiveAlpha} />;
        const hw = wallH / 2;
        // Concourse cutout: columns D(0.3)..H(0.7), rows 7(0.75)..9(1.0)
        const cLeft = (COL_D - 0.5) * slabW;
        const cRight = (COL_H - 0.5) * slabW;
        const cTop = (ROW_7 - 0.5) * slabD;
        const halfW = slabW / 2;
        const halfD = slabD / 2;

        return (
          <>
            {/* Back (north) wall — full width */}
            <mesh position={[0, hw, -halfD - wt / 2]} castShadow receiveShadow>
              <boxGeometry args={[slabW + wt * 2, wallH, wt]} />
              {mat}
            </mesh>
            {/* Left wall — full height */}
            <mesh position={[-halfW - wt / 2, hw, 0]} castShadow receiveShadow>
              <boxGeometry args={[wt, wallH, slabD + wt * 2]} />
              {mat}
            </mesh>
            {/* Right wall — full height */}
            <mesh position={[halfW + wt / 2, hw, 0]} castShadow receiveShadow>
              <boxGeometry args={[wt, wallH, slabD + wt * 2]} />
              {mat}
            </mesh>
            {/* Front wall — left section (A to D) */}
            <mesh position={[((-halfW) + cLeft) / 2, hw, halfD + wt / 2]} castShadow receiveShadow>
              <boxGeometry args={[cLeft - (-halfW) + wt, wallH, wt]} />
              {mat}
            </mesh>
            {/* Front wall — right section (H to K) */}
            <mesh position={[(cRight + halfW) / 2, hw, halfD + wt / 2]} castShadow receiveShadow>
              <boxGeometry args={[halfW - cRight + wt, wallH, wt]} />
              {mat}
            </mesh>
            {/* Concourse left wall (D, row 7 to 9) */}
            <mesh position={[cLeft - wt / 2, hw, (cTop + halfD) / 2]} castShadow receiveShadow>
              <boxGeometry args={[wt, wallH, halfD - cTop + wt]} />
              {mat}
            </mesh>
            {/* Concourse right wall (H, row 7 to 9) */}
            <mesh position={[cRight + wt / 2, hw, (cTop + halfD) / 2]} castShadow receiveShadow>
              <boxGeometry args={[wt, wallH, halfD - cTop + wt]} />
              {mat}
            </mesh>
            {/* Concourse back wall (D to H at row 7) */}
            <mesh position={[(cLeft + cRight) / 2, hw, cTop - wt / 2]} castShadow receiveShadow>
              <boxGeometry args={[cRight - cLeft + wt * 2, wallH, wt]} />
              {mat}
            </mesh>
          </>
        );
      })()}

      {/* Interior walls */}
      <InteriorWalls
        slabW={slabW}
        slabD={slabD}
        wallH={wallH}
        wt={wt}
        floor={plan.floor}
        active={active}
      />

      {/* Floor label */}
      <Text
        position={[0, wallH + span * 0.015, 0]}
        fontSize={span * (active ? 0.035 : 0.025)}
        color={active ? "#1e293b" : "#94a3b8"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={active ? 0.05 : 0}
        outlineColor="#ffffff"
      >
        {plan.label}
      </Text>
    </group>
  );
}

function ImageFloorBuilding({ graph, viewFloor }: { graph: NavigationGraph; viewFloor: number }) {
  const scale = getPlanScale(graph, viewFloor);
  const floors = graph.floorPlans.filter((f) => f.imageUrl);
  const maxSlab = Math.max(
    ...floors.map((f) => Math.max(f.width * scale, f.height * scale)),
    40
  );
  const groundSize = maxSlab * 1.4;
  const stackGap = maxSlab * STACK_GAP_RATIO;

  return (
    <group>
      {/* Ground shadow plane */}
      <mesh position={[0, -maxSlab * SLAB_T_RATIO - 0.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[groundSize, groundSize]} />
        <shadowMaterial opacity={0.15} />
      </mesh>
      <mesh position={[0, -maxSlab * SLAB_T_RATIO - 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color="#eef1f5" roughness={1} />
      </mesh>
      {floors.map((plan) => {
        const active = plan.floor === viewFloor;
        const yOffset = (plan.floor - viewFloor) * stackGap;
        return (
          <TexturedFloorSlab
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

  const showKiosk = viewFloor === kioskLocation.floor && !imageBased;
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
      <ambientLight intensity={navigationMapMode ? 0.75 : imageBased ? 0.7 : 0.55} />
      {imageBased ? (
        <>
          <directionalLight
            position={[25, 40, 20]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-60}
            shadow-camera-right={60}
            shadow-camera-top={60}
            shadow-camera-bottom={-60}
            shadow-camera-near={1}
            shadow-camera-far={120}
            shadow-bias={-0.001}
          />
          <directionalLight position={[-18, 25, -12]} intensity={0.3} />
          <hemisphereLight args={["#ffffff", "#d4dae3", 0.5]} />
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
        const { w, d } = nodeSize(node);
        const handleClick =
          node.locationId && onLocationClick
            ? () => onLocationClick(node.locationId!)
            : undefined;

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

      {showKiosk && !navigationMapMode && <KioskSpot position={kioskPos} label={kioskLabel} />}

      {routePoints.length > 1 && navigationMapMode && (
        <>
          <NavigationBluePath
            points={routePoints}
            progress={isNavigating ? progress : hasArrived ? 1 : 0}
            progressRef={isNavigating ? progressRef : undefined}
            animated={isNavigating && !hasArrived}
            showMovingMarker={isNavigating && !hasArrived}
          />
          <NavigationStartMarker position={routePoints[0]} label={kioskLabel} />
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
