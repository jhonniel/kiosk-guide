"use client";

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, RoundedBox, Text } from "@react-three/drei";
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

/**
 * Round L-joins into a circular bend so the thick guide looks like one pipe,
 * not two capsules butting at a corner.
 */
function filletRoutePoints(
  points: [number, number, number][],
  radius = 1.35,
  steps = 16
): [number, number, number][] {
  if (points.length < 3) return points;

  const out: [number, number, number][] = [points[0]];

  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = new THREE.Vector3(points[i - 1][0], points[i - 1][1], points[i - 1][2]);
    const curr = new THREE.Vector3(points[i][0], points[i][1], points[i][2]);
    const next = new THREE.Vector3(points[i + 1][0], points[i + 1][1], points[i + 1][2]);

    if (Math.abs(prev.y - curr.y) > 0.08 || Math.abs(next.y - curr.y) > 0.08) {
      out.push(points[i]);
      continue;
    }

    const inDir = new THREE.Vector3(curr.x - prev.x, 0, curr.z - prev.z);
    const outDir = new THREE.Vector3(next.x - curr.x, 0, next.z - curr.z);
    const inLen = inDir.length();
    const outLen = outDir.length();
    if (inLen < 0.08 || outLen < 0.08) {
      out.push(points[i]);
      continue;
    }

    inDir.divideScalar(inLen);
    outDir.divideScalar(outLen);
    if (Math.abs(inDir.dot(outDir)) > 0.94) {
      out.push(points[i]);
      continue;
    }

    const r = Math.min(radius, inLen * 0.45, outLen * 0.45);
    const y = curr.y;
    const entry = new THREE.Vector3(curr.x - inDir.x * r, y, curr.z - inDir.z * r);
    const exit = new THREE.Vector3(curr.x + outDir.x * r, y, curr.z + outDir.z * r);
    const center = new THREE.Vector3(
      curr.x - inDir.x * r + outDir.x * r,
      y,
      curr.z - inDir.z * r + outDir.z * r
    );

    const a0 = Math.atan2(entry.z - center.z, entry.x - center.x);
    const a1 = Math.atan2(exit.z - center.z, exit.x - center.x);
    let delta = a1 - a0;
    const turn = inDir.x * outDir.z - inDir.z * outDir.x;
    if (turn > 0 && delta < 0) delta += Math.PI * 2;
    if (turn < 0 && delta > 0) delta -= Math.PI * 2;
    const arcR = Math.hypot(entry.x - center.x, entry.z - center.z) || r;

    out.push([entry.x, y, entry.z]);
    for (let step = 1; step < steps; step += 1) {
      const angle = a0 + (delta * step) / steps;
      out.push([center.x + Math.cos(angle) * arcR, y, center.z + Math.sin(angle) * arcR]);
    }
    out.push([exit.x, y, exit.z]);
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

function xzTangent(from: THREE.Vector3, to: THREE.Vector3, fallback: THREE.Vector3) {
  const dir = new THREE.Vector3(to.x - from.x, 0, to.z - from.z);
  if (dir.lengthSq() < 1e-8) return fallback.clone();
  return dir.normalize();
}

/** Flat floor strip — no Line2 capsules, so the guide has no oval beads. */
function buildRibbonGeometry(points: [number, number, number][], halfWidth: number) {
  const geometry = new THREE.BufferGeometry();
  if (points.length < 2) return geometry;

  const vecs = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < vecs.length; i += 1) {
    const prev = vecs[Math.max(0, i - 1)];
    const curr = vecs[i];
    const next = vecs[Math.min(vecs.length - 1, i + 1)];
    const incoming = xzTangent(prev, curr, new THREE.Vector3(1, 0, 0));
    const outgoing = xzTangent(curr, next, incoming);
    const tangent = incoming.clone().add(outgoing);
    if (tangent.lengthSq() < 1e-8) tangent.copy(incoming);
    tangent.normalize();
    const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(halfWidth);
    positions.push(curr.x + perp.x, curr.y, curr.z + perp.z);
    positions.push(curr.x - perp.x, curr.y, curr.z - perp.z);
  }

  for (let i = 0; i < vecs.length - 1; i += 1) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }

  const addCap = (center: THREE.Vector3, outward: THREE.Vector3) => {
    const side = new THREE.Vector3(-outward.z, 0, outward.x).normalize();
    const origin = positions.length / 3;
    positions.push(center.x, center.y, center.z);
    const steps = 12;
    for (let i = 0; i <= steps; i += 1) {
      const angle = -Math.PI / 2 + (Math.PI * i) / steps;
      const p = center
        .clone()
        .addScaledVector(side, Math.cos(angle) * halfWidth)
        .addScaledVector(outward, Math.sin(angle) * halfWidth);
      positions.push(p.x, p.y, p.z);
    }
    for (let i = 0; i < steps; i += 1) {
      indices.push(origin, origin + 2 + i, origin + 1 + i);
    }
  };

  const startOut = xzTangent(vecs[1], vecs[0], new THREE.Vector3(-1, 0, 0));
  const endOut = xzTangent(vecs[vecs.length - 2], vecs[vecs.length - 1], new THREE.Vector3(1, 0, 0));
  addCap(vecs[0], startOut);
  addCap(vecs[vecs.length - 1], endOut);

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function RouteRibbon({
  points,
  width,
  color,
  opacity = 1,
  depthTest = true,
  renderOrder = 15,
}: {
  points: [number, number, number][];
  width: number;
  color: string;
  opacity?: number;
  depthTest?: boolean;
  renderOrder?: number;
}) {
  const geometry = useMemo(() => buildRibbonGeometry(points, width / 2), [points, width]);
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    invalidate();
    return () => geometry.dispose();
  }, [geometry, invalidate]);
  if (points.length < 2) return null;
  return (
    <mesh geometry={geometry} renderOrder={renderOrder} frustumCulled={false}>
      <meshBasicMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        depthTest={depthTest}
        depthWrite={false}
        toneMapped={false}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}

function splitPolyline(points: [number, number, number][], distance: number) {
  const lengths = polylineLengths(points);
  const total = lengths[lengths.length - 1] || 1;
  const at = Math.min(Math.max(distance, 0), total);
  if (at <= 0.001) return { walked: [] as typeof points, remaining: points };
  if (at >= total - 0.001) return { walked: points, remaining: [] as typeof points };

  let i = 1;
  while (i < lengths.length - 1 && lengths[i] < at) i += 1;
  const span = lengths[i] - lengths[i - 1] || 1;
  const u = (at - lengths[i - 1]) / span;
  const a = points[i - 1];
  const b = points[i];
  const mid: [number, number, number] = [
    a[0] + (b[0] - a[0]) * u,
    a[1] + (b[1] - a[1]) * u,
    a[2] + (b[2] - a[2]) * u,
  ];
  return {
    walked: [...points.slice(0, i), mid],
    remaining: [mid, ...points.slice(i)],
  };
}

function curveToLinePoints(curve: THREE.CatmullRomCurve3, count = 72) {
  return curve.getPoints(count).map((v) => [v.x, PATH_Y + PATH_LIFT, v.z] as [number, number, number]);
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
  const linePoints = useMemo(() => {
    if (straightPoints && straightPoints.length >= 2) return straightPoints;
    if (curve) return curveToLinePoints(curve, 96);
    return [] as [number, number, number][];
  }, [straightPoints, curve]);
  const shownProgress = preview ? 0 : Math.max(0, Math.min(1, walkedProgress));
  const { walked, remaining } = useMemo(() => {
    if (linePoints.length < 2) return { walked: [] as typeof linePoints, remaining: [] as typeof linePoints };
    const total = polylineLengths(linePoints)[linePoints.length - 1] || 1;
    return splitPolyline(linePoints, shownProgress * total);
  }, [linePoints, shownProgress]);

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
  const depthTest = !mall;
  const order = mall ? 40 : 15;

  if (walked.length < 2 && remaining.length < 2) return null;

  return (
    <group renderOrder={order}>
      {remaining.length >= 2 ? (
        <RouteRibbon
          points={remaining}
          width={width}
          color={palette.core}
          depthTest={depthTest}
          renderOrder={order}
        />
      ) : null}
      {walked.length >= 2 ? (
        <RouteRibbon
          points={walked}
          width={width}
          color={palette.walkedCore}
          depthTest={depthTest}
          renderOrder={order + 1}
        />
      ) : null}
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
    () => (straight ? filletRoutePoints(straightRoutePoints(points)) : undefined),
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
