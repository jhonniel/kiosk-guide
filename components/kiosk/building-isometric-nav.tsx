"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  FLOOR_LAYERS,
  nodeExtrudedColors,
} from "@/features/building-directory/navigation/building-3d";
import type { NavNode } from "@/features/building-directory/navigation/types";

const NAV_BLUE = "#2563eb";
const NAV_BLUE_BRIGHT = "#3b82f6";
const NAV_BLUE_GLOW = "#60a5fa";
const NAV_BLUE_LIGHT = "#bfdbfe";
const NAV_PINK = "#ec4899";
const NAV_PINK_BRIGHT = "#f472b6";
const NAV_PINK_GLOW = "#fbcfe8";
const NAV_PINK_LIGHT = "#fce7f3";
const NAV_KIOSK = "#22c55e";
const NAV_KIOSK_BRIGHT = "#4ade80";
const NAV_KIOSK_GLOW = "#86efac";
const NAV_KIOSK_LIGHT = "#bbf7d0";
const WALL_ISO = "#cbd5e1";
const WALL_TOP_ISO = "#94a3b8";
const FLOOR_ISO = "#f8fafc";
const HALL_ISO = "#dcfce7";
const HALL_ISO_EDGE = "#86efac";

const PATH_Y = FLOOR_LAYERS.pathY + 0.04;
const MARKER_Y = FLOOR_LAYERS.markerY + 0.06;
const PATH_WIDTH = 0.32;
const PATH_LIFT = 0.025;

/** Rounded corners on hallway grid paths — avoids diagonal shortcuts through open floor. */
function filletRoutePoints(points: [number, number, number][], radius = 0.65): [number, number, number][] {
  if (points.length < 3) return points;

  const out: [number, number, number][] = [points[0]];

  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = new THREE.Vector3(points[i - 1][0], PATH_Y, points[i - 1][2]);
    const curr = new THREE.Vector3(points[i][0], PATH_Y, points[i][2]);
    const next = new THREE.Vector3(points[i + 1][0], PATH_Y, points[i + 1][2]);

    const inDir = curr.clone().sub(prev);
    const outDir = next.clone().sub(curr);
    const inLen = inDir.length();
    const outLen = outDir.length();
    if (inLen < 0.05 || outLen < 0.05) {
      out.push(points[i]);
      continue;
    }

    inDir.divideScalar(inLen);
    outDir.divideScalar(outLen);
    const alignment = inDir.dot(outDir);
    if (Math.abs(alignment) > 0.92) {
      out.push(points[i]);
      continue;
    }

    const r = Math.min(radius, inLen * 0.42, outLen * 0.42);
    const entry = curr.clone().sub(inDir.clone().multiplyScalar(r));
    const exit = curr.clone().add(outDir.clone().multiplyScalar(r));

    out.push([entry.x, PATH_Y, entry.z]);
    for (let step = 1; step <= 5; step += 1) {
      const t = step / 5;
      const inv = 1 - t;
      const x = inv * inv * entry.x + 2 * inv * t * curr.x + t * t * exit.x;
      const z = inv * inv * entry.z + 2 * inv * t * curr.z + t * t * exit.z;
      out.push([x, PATH_Y, z]);
    }
  }

  out.push(points[points.length - 1]);
  return out;
}

function buildRouteCurve(points: [number, number, number][]) {
  if (points.length < 2) return null;
  const filleted = filletRoutePoints(points);
  const vectors = filleted.map(([x, , z]) => new THREE.Vector3(x, PATH_Y, z));
  return new THREE.CatmullRomCurve3(vectors, false, "centripetal", 0.15);
}

/** Axis-aligned hallway runs — L corners only, never diagonal shortcuts across open floor. */
function straightRoutePoints(points: [number, number, number][]): [number, number, number][] {
  const floorY = PATH_Y + PATH_LIFT;
  const out: [number, number, number][] = [];
  for (const [x, y, z] of points) {
    // Keep hall runs on the floor strip; keep stair climbs above the tread tops.
    const height = y > floorY + 0.05 ? y + 0.06 : floorY;
    const prev = out[out.length - 1];
    if (prev && Math.hypot(prev[0] - x, prev[2] - z) < 0.02 && Math.abs(prev[1] - height) < 0.02) {
      continue;
    }
    // On the floor plane, force rectilinear joins (mall guide style).
    if (
      prev &&
      height <= floorY + 0.05 &&
      prev[1] <= floorY + 0.05 &&
      Math.abs(prev[0] - x) > 0.08 &&
      Math.abs(prev[2] - z) > 0.08
    ) {
      out.push([x, floorY, prev[2]]);
    }
    out.push([x, height, z]);
  }
  return out;
}

function polylineLengths(points: [number, number, number][]) {
  const lengths = [0];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    // Include vertical rise so stair climbs count in progress and length.
    lengths.push(
      lengths[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    );
  }
  return lengths;
}

function pointOnPolyline(points: [number, number, number][], t: number) {
  const lengths = polylineLengths(points);
  const total = lengths[lengths.length - 1] || 1;
  const dist = Math.min(Math.max(t, 0), 0.999) * total;
  let i = 1;
  while (i < lengths.length - 1 && lengths[i] < dist) i += 1;
  const span = lengths[i] - lengths[i - 1] || 1;
  const u = (dist - lengths[i - 1]) / span;
  const a = points[i - 1];
  const b = points[i];
  return new THREE.Vector3(
    a[0] + (b[0] - a[0]) * u,
    a[1] + (b[1] - a[1]) * u,
    a[2] + (b[2] - a[2]) * u
  );
}

type RouteStroke = {
  points: [number, number, number][];
  /** Distance along the route where this stroke starts and ends (overlap pad included). */
  d0: number;
  d1: number;
};

/**
 * Short overlapping two-point strokes (a long colinear polyline drops the middle of the hallway),
 * tagged with where each sits along the route.
 */
function routeStrokes(points: [number, number, number][]): { strokes: RouteStroke[]; total: number } {
  const strokes: RouteStroke[] = [];
  const maxLen = 3;
  let along = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dz = b[2] - a[2];
    const len = Math.hypot(dx, dy, dz);
    if (len >= 0.02) {
      const steps = Math.max(1, Math.ceil(len / maxLen));
      const pad = 0.12 / len;
      for (let step = 0; step < steps; step += 1) {
        const u0 = Math.max(0, step / steps - pad);
        const u1 = Math.min(1, (step + 1) / steps + pad);
        strokes.push({
          points: [
            [a[0] + dx * u0, a[1] + dy * u0, a[2] + dz * u0],
            [a[0] + dx * u1, a[1] + dy * u1, a[2] + dz * u1],
          ],
          d0: along + len * u0,
          d1: along + len * u1,
        });
      }
    }
    along += len;
  }
  return { strokes, total: along };
}

/**
 * Walked / remaining strokes at a distance along the route.
 * Whole strokes keep their point arrays, so only the stroke under the marker is rebuilt.
 */
function splitStrokes(strokes: RouteStroke[], distance: number) {
  const walked: { key: string; points: [number, number, number][] }[] = [];
  const remaining: { key: string; points: [number, number, number][] }[] = [];
  strokes.forEach((stroke, index) => {
    if (stroke.d1 <= distance) {
      walked.push({ key: `${index}`, points: stroke.points });
      return;
    }
    if (stroke.d0 >= distance) {
      remaining.push({ key: `${index}`, points: stroke.points });
      return;
    }
    const [a, b] = stroke.points;
    const f = (distance - stroke.d0) / (stroke.d1 - stroke.d0 || 1);
    const mid: [number, number, number] = [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ];
    walked.push({ key: `${index}-part`, points: [a, mid] });
    remaining.push({ key: `${index}-part`, points: [mid, b] });
  });
  return { walked, remaining };
}

function curveToLinePoints(curve: THREE.CatmullRomCurve3, count = 72) {
  return curve.getPoints(count).map((v) => [v.x, PATH_Y + PATH_LIFT, v.z] as [number, number, number]);
}

const lineMat = {
  depthTest: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -4,
  polygonOffsetUnits: -4,
};

/** Mall guide draws on top of stairs/floors so it never sits under the mesh. */
const mallLineMat = {
  depthTest: false,
  depthWrite: false,
};

function splitCurveLinePoints(curve: THREE.CatmullRomCurve3, progress: number, count = 80) {
  const pts = curve.getPoints(count).map((v) => [v.x, PATH_Y + PATH_LIFT, v.z] as [number, number, number]);
  if (pts.length < 2) return { walked: pts, remaining: [] as typeof pts };
  const t = Math.max(0, Math.min(1, progress));
  const splitIdx = Math.max(1, Math.round(t * (pts.length - 1)));
  return {
    walked: pts.slice(0, splitIdx + 1),
    remaining: pts.slice(splitIdx),
  };
}

function FlatRoutePath({
  curve,
  straightPoints,
  variant = "kiosk",
  walkedProgress = 1,
  preview = false,
}: {
  curve?: THREE.CatmullRomCurve3 | null;
  straightPoints?: [number, number, number][];
  variant?: "blue" | "mall" | "kiosk";
  walkedProgress?: number;
  preview?: boolean;
}) {
  const route = useMemo(
    () => (straightPoints && straightPoints.length >= 2 ? routeStrokes(straightPoints) : null),
    [straightPoints]
  );
  const shownProgress = preview ? 0 : Math.max(0, Math.min(1, walkedProgress));
  const { walked, remaining } = useMemo(() => {
    if (route) return splitStrokes(route.strokes, shownProgress * route.total);
    if (!curve) return { walked: [], remaining: [] };
    const split = splitCurveLinePoints(curve, shownProgress);
    return {
      walked: split.walked.length >= 2 ? [{ key: "0", points: split.walked }] : [],
      remaining: split.remaining.length >= 2 ? [{ key: "0", points: split.remaining }] : [],
    };
  }, [route, curve, shownProgress]);

  const palette =
    variant === "mall"
      ? {
          glow: "#fde047",
          core: "#facc15",
          stripe: "#fef08a",
          remain: "#facc15",
          shadow: "#a16207",
          walkedGlow: "#22c55e",
          walkedCore: "#166534",
          walkedShadow: "#052e16",
        }
      : variant === "kiosk"
        ? {
            glow: "#ecfdf5",
            core: "#16a34a",
            stripe: "#ffffff",
            remain: "#bbf7d0",
            shadow: "#14532d",
            walkedGlow: "#ecfdf5",
            walkedCore: "#16a34a",
            walkedShadow: "#14532d",
          }
        : {
            glow: NAV_BLUE_LIGHT,
            core: NAV_BLUE,
            stripe: "#ffffff",
            remain: "#dbeafe",
            shadow: "#1e3a8a",
            walkedGlow: NAV_BLUE_LIGHT,
            walkedCore: NAV_BLUE,
            walkedShadow: "#1e3a8a",
          };

  const mall = variant === "mall";
  const width = PATH_WIDTH + (mall || variant === "kiosk" ? 0.08 : 0);
  const mat = mall ? mallLineMat : lineMat;

  if (walked.length === 0 && remaining.length === 0) return null;

  return (
    <group renderOrder={mall ? 40 : 15}>
      {remaining.map(({ key, points: pts }) => (
          <group key={`remain-${key}`} renderOrder={mall ? 40 : 15}>
            <Line
              points={pts}
              color={palette.shadow}
              lineWidth={width + 0.14}
              worldUnits
              transparent
              opacity={mall ? 0.2 : 0.12}
              {...mat}
            />
            <Line
              points={pts}
              color={palette.glow}
              lineWidth={width + 0.14}
              worldUnits
              transparent
              opacity={0.92}
              {...mat}
            />
            <Line points={pts} color={palette.core} lineWidth={width} worldUnits {...mat} />
          </group>
        ))}
      {walked.map(({ key, points: pts }) => (
          <group key={`walked-${key}`} renderOrder={mall ? 41 : 15}>
            <Line
              points={pts}
              color={palette.walkedShadow}
              lineWidth={width + 0.22}
              worldUnits
              transparent
              opacity={mall ? 0.22 : 0.18}
              {...mat}
            />
            <Line
              points={pts}
              color={palette.walkedGlow}
              lineWidth={width + 0.1}
              worldUnits
              transparent
              opacity={0.7}
              {...mat}
            />
            <Line points={pts} color={palette.walkedCore} lineWidth={width} worldUnits {...mat} />
          </group>
        ))}
    </group>
  );
}

function NavigationOvalMarker({
  curve,
  straightPoints,
  progress,
  progressRef,
  mapProgress,
  animated,
  variant = "blue",
}: {
  curve?: THREE.CatmullRomCurve3 | null;
  straightPoints?: [number, number, number][];
  progress: number;
  progressRef?: RefObject<number>;
  mapProgress?: (globalProgress: number) => number;
  animated: boolean;
  variant?: "blue" | "mall" | "kiosk";
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const shirt =
    variant === "mall" ? "#1d4ed8" : variant === "kiosk" ? "#15803d" : "#1d4ed8";

  useFrame((state) => {
    if (!groupRef.current) return;

    const raw =
      progressRef?.current != null && mapProgress
        ? mapProgress(progressRef.current)
        : progressRef?.current ?? progress;
    const t = Math.min(Math.max(raw, 0), 0.999);
    const point =
      straightPoints && straightPoints.length >= 2
        ? pointOnPolyline(straightPoints, t)
        : curve?.getPointAt(t);
    if (!point) return;

    groupRef.current.position.set(point.x, MARKER_Y, point.z);

    const pulse = animated ? 1 + Math.sin(state.clock.elapsedTime * 4.5) * 0.08 : 1;
    if (ringRef.current) {
      ringRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group ref={groupRef} renderOrder={40}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.42, 0.62, 40]} />
        <meshBasicMaterial color="#ffffff" depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color={shirt} depthWrite={false} toneMapped={false} />
      </mesh>
      <Html position={[0, 1.2, 0]} center zIndexRange={[40, 0]} style={{ pointerEvents: "none" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: shirt,
            border: "3px solid #ffffff",
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="7" r="3.2" fill="#fde68a" />
            <path d="M5.5 19.5c.7-3.8 3.2-5.8 6.5-5.8s5.8 2 6.5 5.8" fill="#ffffff" />
          </svg>
        </div>
      </Html>
    </group>
  );
}

export function IsometricWall({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh castShadow={false} receiveShadow renderOrder={2}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={WALL_ISO} roughness={0.9} depthWrite />
      </mesh>
      <mesh position={[0, size[1] / 2 + 0.02, 0]} renderOrder={3}>
        <boxGeometry args={[size[0] + 0.02, 0.04, size[2] + 0.02]} />
        <meshStandardMaterial color={WALL_TOP_ISO} roughness={0.85} depthWrite />
      </mesh>
    </group>
  );
}

export function IsometricRoom({
  position,
  size,
  label,
  highlighted,
  onClick,
  hideLabel = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  label: string;
  highlighted?: boolean;
  onClick?: () => void;
  hideLabel?: boolean;
}) {
  const [w, h, d] = size;
  const wt = 0.1;

  return (
    <group position={position}>
      <mesh position={[0, FLOOR_LAYERS.roomFloorY, 0]} receiveShadow renderOrder={1}>
        <boxGeometry args={[w - 0.06, 0.02, d - 0.06]} />
        <meshStandardMaterial color={highlighted ? "#fef08a" : FLOOR_ISO} depthWrite />
      </mesh>
      <IsometricWall position={[0, h / 2 + FLOOR_LAYERS.roomFloorY, -d / 2 + wt / 2]} size={[w, h, wt]} />
      <IsometricWall position={[-w / 2 + wt / 2, h / 2 + FLOOR_LAYERS.roomFloorY, 0]} size={[wt, h, d]} />
      <IsometricWall position={[w / 2 - wt / 2, h / 2 + FLOOR_LAYERS.roomFloorY, 0]} size={[wt, h, d]} />
      <IsometricWall position={[0, h / 2 + FLOOR_LAYERS.roomFloorY, d / 2 - wt / 2]} size={[w * 0.55, h, wt]} />
      {!hideLabel && label ? (
        <Text
          position={[0, FLOOR_LAYERS.roomFloorY + h + 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.32}
          color={highlighted ? "#854d0e" : "#475569"}
          anchorX="center"
          anchorY="middle"
          maxWidth={w}
          renderOrder={20}
        >
          {label}
        </Text>
      ) : null}
      {onClick && (
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
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

/** Polished extruded room block for navigation map mode. */
export function NavIsometricRoom({
  node,
  position,
  size,
  label,
  highlighted,
  isDestination,
  onClick,
}: {
  node: NavNode;
  position: [number, number, number];
  size: [number, number, number];
  label: string;
  highlighted?: boolean;
  isDestination?: boolean;
  onClick?: () => void;
}) {
  const [w, h, d] = size;
  const colors = nodeExtrudedColors(node, !!highlighted || !!isDestination);
  const radius = Math.min(0.1, w * 0.06, d * 0.06, h * 0.06);
  const accent = highlighted || isDestination;

  return (
    <group position={position}>
      <mesh position={[0, FLOOR_LAYERS.roomFloorY, 0]} receiveShadow renderOrder={1}>
        <boxGeometry args={[w + 0.08, 0.015, d + 0.08]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} depthWrite />
      </mesh>
      <RoundedBox
        args={[w, h, d]}
        radius={radius}
        smoothness={4}
        position={[0, FLOOR_LAYERS.roomFloorY + h / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={colors.body}
          emissive={colors.emissive}
          emissiveIntensity={accent ? 0.38 : 0.1}
          roughness={0.42}
          metalness={0.06}
        />
      </RoundedBox>
      {accent && (
        <>
          <mesh position={[0, FLOOR_LAYERS.roomFloorY + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(w, d) * 0.44, Math.max(w, d) * 0.58, 32]} />
            <meshBasicMaterial
              color={isDestination ? "#f59e0b" : "#22c55e"}
              transparent
              opacity={0.55}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, FLOOR_LAYERS.roomFloorY + h + 0.04, 0]}>
            <boxGeometry args={[w + 0.06, 0.04, d + 0.06]} />
            <meshStandardMaterial
              color={isDestination ? "#fbbf24" : "#86efac"}
              emissive={isDestination ? "#f59e0b" : "#22c55e"}
              emissiveIntensity={0.35}
              transparent
              opacity={0.85}
            />
          </mesh>
        </>
      )}
      {label ? (
        <Text
          position={[0, FLOOR_LAYERS.roomFloorY + h + 0.14, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.28}
          color={accent ? "#14532d" : "#334155"}
          anchorX="center"
          anchorY="middle"
          maxWidth={w + 0.8}
          renderOrder={20}
          outlineWidth={0.015}
          outlineColor="#ffffff"
        >
          {label}
        </Text>
      ) : null}
      {onClick && (
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
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

/** Start pin at the beginning of the route. */
export function NavigationStartMarker({
  position,
  label,
}: {
  position: [number, number, number];
  label: string;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!pulseRef.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.8) * 0.1;
    pulseRef.current.scale.set(s, s, 1);
  });

  return (
    <group position={[position[0], MARKER_Y, position[2]]} renderOrder={30}>
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[0.34, 0.48, 32]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.34, 32]} />
        <meshBasicMaterial color="#2563eb" depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
        <circleGeometry args={[0.11, 32]} />
        <meshBasicMaterial color="#ffffff" depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.28, 10]} />
        <meshStandardMaterial color="#1e40af" roughness={0.4} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.16, 18, 18]} />
        <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.35} roughness={0.35} />
      </mesh>
      <Text
        position={[0, 0.72, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.28}
        color="#1e3a8a"
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
        outlineWidth={0.012}
        outlineColor="#ffffff"
        renderOrder={31}
      >
        {label}
      </Text>
    </group>
  );
}

/** Static marker at kiosk / start position (preview without full route). */
export function PersonMarker({ position }: { position: [number, number, number] }) {
  return <NavigationStartMarker position={position} label="" />;
}

export function DestinationCallout({
  position,
  label,
}: {
  position: [number, number, number];
  label: string;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pulseRef.current) {
      const s = 1 + Math.sin(t * 3.2) * 0.12;
      pulseRef.current.scale.set(s, s, 1);
    }
    if (headRef.current) {
      headRef.current.position.y = 0.44 + Math.sin(t * 4) * 0.015;
    }
  });

  return (
    <group position={[position[0], MARKER_Y, position[2]]} renderOrder={30}>
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.38, 0.52, 32]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.36, 32]} />
        <meshBasicMaterial color="#f59e0b" depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}>
        <circleGeometry args={[0.12, 32]} />
        <meshBasicMaterial color="#ffffff" depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.26, 10]} />
        <meshStandardMaterial color="#b45309" roughness={0.45} />
      </mesh>
      <mesh ref={headRef} position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.15, 18, 18]} />
        <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.4} roughness={0.35} />
      </mesh>
      <Text
        position={[0, 0.74, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.42}
        color="#1a2744"
        anchorX="center"
        anchorY="middle"
        maxWidth={5}
        outlineWidth={0.012}
        outlineColor="#ffffff"
        renderOrder={31}
      >
        {label}
      </Text>
    </group>
  );
}

export function NavigationBluePath({
  points,
  progress,
  progressRef,
  mapProgress,
  animated,
  showMovingMarker = true,
  variant = "kiosk",
  preview = false,
}: {
  points: [number, number, number][];
  progress: number;
  progressRef?: RefObject<number>;
  mapProgress?: (globalProgress: number) => number;
  animated: boolean;
  showMovingMarker?: boolean;
  variant?: "blue" | "mall" | "kiosk";
  preview?: boolean;
}) {
  const straight = variant === "mall";
  const straightPoints = useMemo(
    () => (straight ? straightRoutePoints(points) : undefined),
    [points, straight]
  );
  const curve = useMemo(() => (straight ? null : buildRouteCurve(points)), [points, straight]);

  if (straight ? !straightPoints || straightPoints.length < 2 : !curve) return null;

  return (
    <group renderOrder={15}>
      <FlatRoutePath
        curve={curve}
        straightPoints={straightPoints}
        variant={variant}
        walkedProgress={progress}
        preview={preview}
      />

      {showMovingMarker && (
        <NavigationOvalMarker
          curve={curve}
          straightPoints={straightPoints}
          progress={progress}
          progressRef={progressRef}
          mapProgress={mapProgress}
          animated={animated}
          variant={variant}
        />
      )}
    </group>
  );
}

export { HALL_ISO, HALL_ISO_EDGE, FLOOR_ISO };
