"use client";

import { useMemo, useRef, useLayoutEffect, type ReactNode, type RefObject } from "react";
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
  CAPITOL_UPPER_HALL_WELL,
  map2DToFloorPlan3D,
  nodeSize,
  imagePlanElevatorColumn,
  imagePlanRoomColumn,
  imagePlanRoomParts,
  nodeSizeForImagePlan,
  nodeStairwellFootprint,
  routeTo3DPoints,
  stairTreadGuidePoints,
  type KioskLocationConfig,
} from "@/features/building-directory/navigation/building-3d";
import { resolveFloorRouteProgress } from "@/features/building-directory/navigation/routing-engine";
import {
  DestinationCallout,
  HALL_ISO,
  HALL_ISO_EDGE,
  NavIsometricRoom,
  IsometricWall,
  NavigationBluePath,
  NavigationStartMarker,
} from "@/components/kiosk/building-isometric-nav";
import {
  ImagePlanElevator,
  ImagePlanExtrudedRoom,
  ImagePlanFacilityPin,
  ImagePlanKiosk,
  ImagePlanStairwell,
} from "@/components/kiosk/image-plan-extruded-room";
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
  onLocationClick?: (locationId: string, floor?: number, label?: string) => void;
  selectedNode?: NavNode | null;
  roomOverlayRef?: RefObject<HTMLDivElement | null>;
  roomAnchorPosition?: [number, number, number] | null;
}

const ISO_WALL_H = 0.48;

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

/** Open well centered on the green hallway, from the central stairs to the east stairs. */
function upperHallAtrium(plan: FloorPlanConfig, scale: number) {
  const cx = plan.width / 2;
  const cy = plan.height / 2;
  const world = (px: number, py: number) => ({
    x: (px - cx) * scale,
    z: (py - cy) * scale,
  });
  const a = world(CAPITOL_UPPER_HALL_WELL.x0, CAPITOL_UPPER_HALL_WELL.y0);
  const b = world(CAPITOL_UPPER_HALL_WELL.x1, CAPITOL_UPPER_HALL_WELL.y1);
  return {
    x0: Math.min(a.x, b.x),
    x1: Math.max(a.x, b.x),
    y0: -Math.max(a.z, b.z),
    y1: -Math.min(a.z, b.z),
  };
}

function planeWithHole(
  width: number,
  height: number,
  holes: Array<{ x0: number; y0: number; x1: number; y1: number }>
) {
  const hw = width / 2;
  const hd = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hd);
  shape.lineTo(hw, -hd);
  shape.lineTo(hw, hd);
  shape.lineTo(-hw, hd);
  shape.closePath();
  for (const hole of holes) {
    const path = new THREE.Path();
    path.moveTo(hole.x0, hole.y0);
    path.lineTo(hole.x0, hole.y1);
    path.lineTo(hole.x1, hole.y1);
    path.lineTo(hole.x1, hole.y0);
    path.closePath();
    shape.holes.push(path);
  }
  const geo = new THREE.ShapeGeometry(shape);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + hw) / width, (pos.getY(i) + hd) / height);
  }
  uv.needsUpdate = true;
  return geo;
}

function ImagePlan3DSlab({
  plan,
  scale,
  active,
  yOffset,
  holes,
}: {
  plan: FloorPlanConfig;
  scale: number;
  active: boolean;
  yOffset: number;
  holes: Array<{ x0: number; y0: number; x1: number; y1: number }>;
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

  const floorGeos = useMemo(() => {
    return {
      base: planeWithHole(slabW + 1.5, slabD + 1.5, holes),
      plan: planeWithHole(slabW, slabD, holes),
    };
  }, [holes, slabW, slabD]);

  useLayoutEffect(() => {
    return () => {
      floorGeos.base.dispose();
      floorGeos.plan.dispose();
    };
  }, [floorGeos]);

  return (
    <group position={[0, yOffset, 0]}>
      {/* Warm mall floor base */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={floorGeos.base}>
        <meshStandardMaterial color="#ddd0bc" roughness={0.92} />
      </mesh>

      {/* Floor plan texture */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={floorGeos.plan}>
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

/** How far the floor below sits under an upper-floor hallway opening. */
const ATRIUM_DROP = 1.15;

/** The floor under the hallway opening, so the cut looks down onto that level. */
function BelowFloorWell({
  plan,
  belowPlan,
  scale,
}: {
  plan: FloorPlanConfig;
  belowPlan: FloorPlanConfig;
  scale: number;
}) {
  const texture = useTexture(belowPlan.imageUrl!);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    invalidate();
  }, [texture, invalidate]);

  const layout = useMemo(() => {
    const hole = upperHallAtrium(plan, scale);
    const slabW = plan.width * scale;
    const slabD = plan.height * scale;
    const width = hole.x1 - hole.x0;
    const depth = hole.y1 - hole.y0;
    const cx = (hole.x0 + hole.x1) / 2;
    const localCy = (hole.y0 + hole.y1) / 2;
    const geo = new THREE.PlaneGeometry(width + 0.24, depth + 0.24);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i += 1) {
      const slabX = cx + pos.getX(i);
      const slabY = localCy + pos.getY(i);
      uv.setXY(i, (slabX + slabW / 2) / slabW, (slabY + slabD / 2) / slabD);
    }
    uv.needsUpdate = true;
    return { geo, cx, cz: -localCy, width, depth, hole };
  }, [plan, scale]);

  useLayoutEffect(() => {
    return () => {
      layout.geo.dispose();
    };
  }, [layout]);

  const { hole, cx, cz, width, depth } = layout;
  const wallT = 0.16;
  const southZ = -hole.y0;
  const northZ = -hole.y1;
  const wallY = -ATRIUM_DROP / 2;

  return (
    <group>
      <mesh
        position={[cx, -ATRIUM_DROP + 0.02, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={layout.geo}
      >
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[cx, wallY, southZ + wallT / 2]}>
        <boxGeometry args={[width + wallT * 2, ATRIUM_DROP, wallT]} />
        <meshStandardMaterial color="#e7dfd2" roughness={0.92} />
      </mesh>
      <mesh position={[cx, wallY, northZ - wallT / 2]}>
        <boxGeometry args={[width + wallT * 2, ATRIUM_DROP, wallT]} />
        <meshStandardMaterial color="#e7dfd2" roughness={0.92} />
      </mesh>
      <mesh position={[hole.x0 - wallT / 2, wallY, cz]}>
        <boxGeometry args={[wallT, ATRIUM_DROP, depth]} />
        <meshStandardMaterial color="#e7dfd2" roughness={0.92} />
      </mesh>
      <mesh position={[hole.x1 + wallT / 2, wallY, cz]}>
        <boxGeometry args={[wallT, ATRIUM_DROP, depth]} />
        <meshStandardMaterial color="#e7dfd2" roughness={0.92} />
      </mesh>
    </group>
  );
}

/** Floor text on the open white bay just north of the male room. */
function FireExitFloorLabel({ graph, viewFloor }: { graph: NavigationGraph; viewFloor: number }) {
  const pos = map2DToFloorPlan3D(112, 184, graph, viewFloor);
  return (
    <Text
      position={[pos.x, 0.45, pos.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={0.64}
      color="#0f172a"
      anchorX="center"
      anchorY="middle"
      maxWidth={4.2}
      renderOrder={20}
      outlineWidth={0.02}
      outlineColor="#ffffff"
    >
      FIRE EXIT
    </Text>
  );
}

function ImageFloorBuilding({ graph, viewFloor }: { graph: NavigationGraph; viewFloor: number }) {
  const scale = getPlanScale(graph, viewFloor);
  const plan = graph.floorPlans.find((f) => f.floor === viewFloor && f.imageUrl);
  const openAtrium = viewFloor === 2 || viewFloor === 3;
  const holes = useMemo(() => {
    if (!plan) return [];
    const openings = openAtrium ? [upperHallAtrium(plan, scale)] : [];
    if (viewFloor !== 3) return openings;
    for (const node of graph.nodes) {
      if (node.floor !== viewFloor || node.type !== "staircase") continue;
      const { w, d } = nodeStairwellFootprint(node, graph);
      const pos = map2DToFloorPlan3D(node.x, node.y, graph, viewFloor);
      openings.push({
        x0: pos.x - w / 2,
        x1: pos.x + w / 2,
        y0: -(pos.z + d / 2),
        y1: -(pos.z - d / 2),
      });
    }
    return openings;
  }, [graph, openAtrium, plan, scale, viewFloor]);
  if (!plan) return null;
  const below = openAtrium
    ? graph.floorPlans.find((floor) => floor.floor === viewFloor - 1 && floor.imageUrl)
    : undefined;

  return (
    <>
      <ImagePlan3DSlab plan={plan} scale={scale} active yOffset={0} holes={holes} />
      {below ? <BelowFloorWell plan={plan} belowPlan={below} scale={scale} /> : null}
    </>
  );
}

function FloorLevelMotion({ floor, children }: { floor: number; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const previousFloor = useRef(floor);
  const { invalidate } = useThree();

  useLayoutEffect(() => {
    const mesh = group.current;
    if (!mesh) return;
    const previous = previousFloor.current;
    previousFloor.current = floor;
    if (previous === floor) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      mesh.position.y = 0;
      return;
    }
    mesh.position.y = floor > previous ? -0.55 : 0.55;
    invalidate();
  }, [floor, invalidate]);

  useFrame((_, delta) => {
    const mesh = group.current;
    if (!mesh || mesh.position.y === 0) return;
    mesh.position.y = THREE.MathUtils.damp(mesh.position.y, 0, 9, delta);
    if (Math.abs(mesh.position.y) < 0.008) mesh.position.y = 0;
    else invalidate();
  });

  return <group ref={group}>{children}</group>;
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
  const locationClickRef = useRef(onLocationClick);
  locationClickRef.current = onLocationClick;
  const highlightNode = findNode(graph, highlightLocationId);
  const destNode = highlightNode ?? (activeRoute ? findNode(graph, activeRoute.toLocationId) : undefined);
  const destinationLabel = activeRoute?.destinationName ?? destNode?.label ?? "";
  const imageBased = graphHasFloorPlanImages(graph);

  const floorPlan = graph.floorPlans.find((f) => f.floor === viewFloor);
  const useImageView = imageBased && Boolean(floorPlan?.imageUrl);
  const plan = getActivePlanOrFirst(graph, viewFloor);
  const scale = getPlanScale(graph, viewFloor);

  const visibleNodes = useMemo(() => {
    const onFloor = graph.nodes.filter((n) => n.floor === viewFloor && n.type !== "intersection");
    const plan = graph.floorPlans.find((f) => f.floor === viewFloor);
    const groundPlan = graph.floorPlans.find((f) => f.floor === 1);
    const sharesGroundPlan =
      viewFloor !== 1 &&
      Boolean(plan?.imageUrl) &&
      Boolean(groundPlan?.imageUrl) &&
      plan?.width === groundPlan?.width &&
      plan?.height === groundPlan?.height;
    if (!sharesGroundPlan) return onFloor;

    const structure = onFloor.filter(
      (n) => n.type === "elevator" || n.type === "staircase" || n.type === "facility"
    );
    const ownRooms = onFloor.filter(
      (n) => n.type === "room" && imagePlanRoomColumn(n, graph)
    );
    if (ownRooms.length > 0) return [...ownRooms, ...structure];

    const floorName =
      viewFloor === 2 ? "Second Floor" : viewFloor === 3 ? "Third Floor" : `Floor ${viewFloor}`;
    const groundRooms = graph.nodes
      .filter((n) => n.floor === 1 && n.type === "room" && imagePlanRoomColumn(n, graph))
      .sort((a, b) => {
        const band = (node: NavNode) => (node.y < 180 ? 0 : node.y < 360 ? 1 : 2);
        const bandDiff = band(a) - band(b);
        if (bandDiff !== 0) return bandDiff;
        return a.x - b.x;
      })
      .map(
        (n, index): NavNode => ({
          ...n,
          id: `${n.id}__f${viewFloor}`,
          floor: viewFloor,
          label: `${floorName} Office ${index + 1}`,
        })
      );
    return [...groundRooms, ...structure];
  }, [graph, viewFloor]);

  const routePoints = useMemo((): [number, number, number][] => {
    if (!activeRoute) return [];
    const pts = routeTo3DPoints(activeRoute, graph, viewFloor);
    let raw: [number, number, number][] = pts.map((p) => [p.x, 0, p.z] as [number, number, number]);
    if (viewFloor === kioskLocation.floor && raw.length > 0) {
      const kiosk = map2DToFloorPlan3D(kioskLocation.x, kioskLocation.y, graph, viewFloor);
      const first = raw[0];
      const dist = Math.hypot(first[0] - kiosk.x, first[2] - kiosk.z);
      if (dist > 0.5) {
        raw = [[kiosk.x, 0, kiosk.z], ...raw];
      }
    }
    const deduped: [number, number, number][] = [];
    for (const point of raw) {
      const prev = deduped[deduped.length - 1];
      if (prev && Math.hypot(point[0] - prev[0], point[2] - prev[2]) < 0.08) continue;
      const before = deduped[deduped.length - 2];
      if (
        prev &&
        before &&
        Math.abs(before[2] - prev[2]) < 0.05 &&
        Math.abs(prev[2] - point[2]) < 0.05
      ) {
        const wentWest = before[0] > prev[0];
        const reverses = wentWest ? point[0] > prev[0] : point[0] < prev[0];
        if (reverses) deduped.pop();
      }
      deduped.push(point);
    }

    // Only splice stair climbs when this route actually uses that stair to change floors.
    // Hall paths that merely pass near stairs were getting sucked into a zigzag climb.
    const floorsInRoute = new Set(activeRoute.segments.map((segment) => segment.floor));
    const multiFloor = floorsInRoute.size > 1;
    const stairIdsOnRoute = new Set(
      activeRoute.segments.flatMap((segment) =>
        segment.nodeIds.filter((id) => graph.nodes.find((n) => n.id === id)?.type === "staircase")
      )
    );

    if (!multiFloor || stairIdsOnRoute.size === 0) {
      return deduped;
    }

    const stairs = graph.nodes
      .filter(
        (node) =>
          node.floor === viewFloor &&
          node.type === "staircase" &&
          stairIdsOnRoute.has(node.id)
      )
      .map((node) => {
        const origin = map2DToFloorPlan3D(node.x, node.y, graph, viewFloor);
        return {
          id: node.id,
          x: origin.x,
          z: origin.z,
          climb: stairTreadGuidePoints(node, graph),
        };
      });

    // Mouth / flight foot — only match points that belong to the stair approach.
    const nearStair = (
      point: [number, number, number],
      stair: { x: number; z: number; climb: [number, number, number][] }
    ) => {
      const foot = stair.climb[0];
      const land = stair.climb[stair.climb.length - 1];
      return (
        Math.hypot(point[0] - foot[0], point[2] - foot[2]) < 2.2 ||
        Math.hypot(point[0] - land[0], point[2] - land[2]) < 2.2 ||
        (Math.abs(point[0] - stair.x) < 1.2 && Math.abs(point[2] - stair.z) < 2.4)
      );
    };

    const pushUnique = (
      list: [number, number, number][],
      point: [number, number, number]
    ) => {
      const last = list[list.length - 1];
      if (last && Math.hypot(last[0] - point[0], last[1] - point[1], last[2] - point[2]) < 0.06) {
        return;
      }
      list.push(point);
    };

    /** Hall → foot with one L-corner, then climb the flight. */
    const joinHallToFoot = (
      list: [number, number, number][],
      stair: { climb: [number, number, number][] },
      prev: [number, number, number] | undefined
    ) => {
      const foot = stair.climb[0];
      if (prev) {
        if (Math.abs(prev[0] - foot[0]) > 0.08 && Math.abs(prev[2] - foot[2]) > 0.08) {
          pushUnique(list, [foot[0], prev[1], prev[2]]);
        }
      }
      pushUnique(list, [foot[0], 0.08, foot[2]]);
    };

    const onStairs: [number, number, number][] = [];
    const usedStairs = new Set<string>();
    for (let i = 0; i < deduped.length; i += 1) {
      const point = deduped[i];
      const stair = stairs.find((entry) => nearStair(point, entry));
      if (!stair || stair.climb.length < 2) {
        onStairs.push(point);
        continue;
      }
      if (usedStairs.has(stair.id)) continue;
      usedStairs.add(stair.id);

      while (onStairs.length > 0 && nearStair(onStairs[onStairs.length - 1], stair)) {
        onStairs.pop();
      }

      const prev = onStairs[onStairs.length - 1];
      const foot = stair.climb[0];
      const fromHall =
        !prev ||
        Math.hypot(prev[0] - foot[0], prev[2] - foot[2]) >=
          Math.hypot(point[0] - foot[0], point[2] - foot[2]) - 0.01;

      if (fromHall) {
        joinHallToFoot(onStairs, stair, prev);
        for (const step of stair.climb) pushUnique(onStairs, step);
      } else {
        for (const step of [...stair.climb].reverse()) pushUnique(onStairs, step);
        if (prev) {
          pushUnique(onStairs, [foot[0], 0.08, prev[2]]);
        }
      }
    }
    return onStairs;
  }, [activeRoute, graph, viewFloor, kioskLocation]);

  const floorRouteProgress = useMemo(() => {
    if (!activeRoute) return 0;
    if (hasArrived) return 1;
    if (!isNavigating) return 0;
    return resolveFloorRouteProgress(activeRoute, progress, viewFloor);
  }, [activeRoute, hasArrived, isNavigating, progress, viewFloor]);

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
      <ambientLight intensity={navigationMapMode ? 0.82 : useImageView ? 0.78 : 0.55} />
      {useImageView ? (
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

      <FloorLevelMotion floor={viewFloor}>
      {useImageView ? (
        <>
          <ImageFloorBuilding graph={graph} viewFloor={viewFloor} />
          <FireExitFloorLabel graph={graph} viewFloor={viewFloor} />
        </>
      ) : (
        <>
          <mesh position={[0, FLOOR_LAYERS.slabY, 0]} receiveShadow renderOrder={0}>
            <boxGeometry args={[slabW + 2, FLOOR_LAYERS.slabH, slabD + 2]} />
            <meshStandardMaterial
              color={navigationMapMode ? "#ffffff" : "#b0bec9"}
              roughness={0.95}
              depthWrite
            />
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
              const hw = h.width * scale;
              const hd = h.height * scale;
              return (
                <group key={i} position={[cx, FLOOR_LAYERS.hallwayY, cz]}>
                  <mesh renderOrder={1}>
                    <boxGeometry args={[hw + 0.06, FLOOR_LAYERS.hallwayH + 0.01, hd + 0.06]} />
                    <meshStandardMaterial color={HALL_ISO_EDGE} roughness={0.9} depthWrite />
                  </mesh>
                  <mesh renderOrder={2}>
                    <boxGeometry args={[hw, FLOOR_LAYERS.hallwayH, hd]} />
                    <meshStandardMaterial
                      color={HALL_ISO}
                      emissive="#22c55e"
                      emissiveIntensity={0.12}
                      roughness={0.82}
                      depthWrite
                    />
                  </mesh>
                </group>
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
            ? () => locationClickRef.current?.(node.locationId!, node.floor, node.label)
            : undefined;

        if (useImageView) {
          if (/kiosk/i.test(`${node.id} ${node.locationId ?? ""}`)) {
            return null;
          }
          if (node.type === "entrance") {
            return null;
          }
          if (node.type === "staircase") {
            const { w, d, h } = nodeStairwellFootprint(node, graph);
            return (
              <ImagePlanStairwell
                key={node.id}
                node={node}
                position={[pos.x, 0, pos.z]}
                size={[w, h, d]}
                highlighted={highlighted || selectedNode?.id === node.id}
                onClick={handleClick}
              />
            );
          }
          if (node.type === "elevator") {
            const column = imagePlanElevatorColumn(node, graph);
            const elevatorPos = column
              ? map2DToFloorPlan3D(column.x, column.y, graph, viewFloor)
              : pos;
            const sized = column ?? nodeSizeForImagePlan(node, graph);
            return (
              <ImagePlanElevator
                key={node.id}
                node={node}
                position={[elevatorPos.x, 0, elevatorPos.z]}
                size={[sized.w, sized.h, sized.d]}
                highlighted={highlighted || selectedNode?.id === node.id}
                onClick={handleClick}
              />
            );
          }
          if (node.type === "facility") {
            return (
              <ImagePlanFacilityPin
                key={node.id}
                position={[pos.x, 0, pos.z]}
                highlighted={highlighted || selectedNode?.id === node.id}
                onClick={handleClick}
              />
            );
          }
          const roomParts = node.type === "room" ? imagePlanRoomParts(node, graph) : null;
          const column = node.type === "room" ? imagePlanRoomColumn(node, graph) : null;
          const roomPos = roomParts
            ? map2DToFloorPlan3D(roomParts.anchor.x, roomParts.anchor.y, graph, viewFloor)
            : column
              ? map2DToFloorPlan3D(column.x, column.y, graph, viewFloor)
              : pos;
          const sized = column ?? nodeSizeForImagePlan(node, graph);
          return (
            <ImagePlanExtrudedRoom
              key={node.id}
              node={node}
              position={[roomPos.x, 0, roomPos.z]}
              size={[sized.w, sized.h, sized.d]}
              parts={roomParts?.parts}
              highlighted={highlighted || selectedNode?.id === node.id}
              hideLabel={selectedNode?.id === node.id}
              onClick={handleClick}
            />
          );
        }

        if (node.type === "staircase") {
          const { w, d, h } = nodeStairwellFootprint(node, graph);
          return (
            <ImagePlanStairwell
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
          const isDestination = destNode?.id === node.id;
          return (
            <NavIsometricRoom
              key={node.id}
              node={node}
              position={[pos.x, 0, pos.z]}
              size={[w, ISO_WALL_H, d]}
              label={roomLabel(node)}
              highlighted={highlighted && !isDestination}
              isDestination={isDestination}
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

      {showKiosk && imageBased && <ImagePlanKiosk position={kioskPos} label="You're Here" />}
      {showKiosk && !imageBased && !navigationMapMode && <KioskSpot position={kioskPos} label={kioskLabel} />}

      {routePoints.length > 1 && (navigationMapMode || (imageBased && activeRoute)) && (
        <>
          <NavigationBluePath
            points={routePoints}
            progress={floorRouteProgress}
            progressRef={isNavigating ? progressRef : undefined}
            mapProgress={
              isNavigating && activeRoute
                ? (global) => resolveFloorRouteProgress(activeRoute, global, viewFloor)
                : undefined
            }
            animated={isNavigating && !hasArrived}
            showMovingMarker={!hasArrived}
            variant={imageBased ? "mall" : "kiosk"}
            preview={!isNavigating}
          />
          {!imageBased && (
            <NavigationStartMarker position={routePoints[0]} label={kioskLabel} />
          )}
          <DestinationCallout position={routePoints[routePoints.length - 1]} label={destinationLabel} />
        </>
      )}

      </FloorLevelMotion>

      {roomAnchorPosition && roomOverlayRef && (
        <RoomScreenTracker worldPosition={roomAnchorPosition} overlayRef={roomOverlayRef} />
      )}

    </>
  );
}
