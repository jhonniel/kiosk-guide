"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { FLOOR_LAYERS } from "@/features/building-directory/navigation/building-3d";

const NAV_BLUE = "#2563eb";
const NAV_BLUE_BRIGHT = "#3b82f6";
const NAV_BLUE_GLOW = "#60a5fa";
const NAV_BLUE_LIGHT = "#bfdbfe";
const NAV_PINK = "#ec4899";
const NAV_PINK_BRIGHT = "#f472b6";
const NAV_PINK_GLOW = "#fbcfe8";
const NAV_PINK_LIGHT = "#fce7f3";
const WALL_ISO = "#d1d5db";
const WALL_TOP_ISO = "#9ca3af";
const FLOOR_ISO = "#f8fafc";
const HALL_ISO = "#eef2f7";

const PATH_Y = FLOOR_LAYERS.pathY + 0.04;
const MARKER_Y = FLOOR_LAYERS.markerY + 0.06;
const PATH_WIDTH = 0.28;
const PATH_LIFT = 0.02;

function buildRouteCurve(points: [number, number, number][]) {
  if (points.length < 2) return null;
  const vectors = points.map(([x, , z]) => new THREE.Vector3(x, PATH_Y, z));
  return new THREE.CatmullRomCurve3(vectors, false, "catmullrom", 0.42);
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

function FlatRoutePath({
  curve,
  variant = "blue",
}: {
  curve: THREE.CatmullRomCurve3;
  variant?: "blue" | "mall";
}) {
  const linePoints = useMemo(() => curveToLinePoints(curve), [curve]);
  const isMall = variant === "mall";
  const glow = isMall ? NAV_PINK_LIGHT : NAV_BLUE_LIGHT;
  const core = isMall ? NAV_PINK : NAV_BLUE;
  const width = isMall ? PATH_WIDTH + 0.14 : PATH_WIDTH;

  if (linePoints.length < 2) return null;

  return (
    <group renderOrder={15}>
      <Line
        points={linePoints}
        color={glow}
        lineWidth={width + 0.18}
        worldUnits
        transparent
        opacity={isMall ? 0.75 : 0.65}
        {...lineMat}
      />
      <Line
        points={linePoints}
        color={core}
        lineWidth={width}
        worldUnits
        {...lineMat}
      />
      {isMall && (
        <Line
          points={linePoints}
          color="#ffffff"
          lineWidth={width * 0.35}
          worldUnits
          transparent
          opacity={0.85}
          {...lineMat}
        />
      )}
    </group>
  );
}

function NavigationOvalMarker({
  curve,
  progress,
  progressRef,
  animated,
  variant = "blue",
}: {
  curve: THREE.CatmullRomCurve3;
  progress: number;
  progressRef?: RefObject<number>;
  animated: boolean;
  variant?: "blue" | "mall";
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const isMall = variant === "mall";
  const glowColor = isMall ? NAV_PINK_GLOW : NAV_BLUE_GLOW;
  const coreColor = isMall ? NAV_PINK : NAV_BLUE;
  const innerColor = isMall ? NAV_PINK_BRIGHT : NAV_BLUE_BRIGHT;

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = Math.min(Math.max(progressRef?.current ?? progress, 0), 0.999);
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const angle = Math.atan2(tangent.x, tangent.z);

    groupRef.current.position.set(point.x, MARKER_Y, point.z);
    groupRef.current.rotation.set(0, angle, 0);

    const pulse = animated ? 1 + Math.sin(state.clock.elapsedTime * 5.5) * 0.14 : 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.08;
    if (glowRef.current) {
      glowRef.current.scale.set(pulse * 1.7, pulse * 1.15, 1);
    }
    if (innerRef.current && animated) {
      innerRef.current.position.y = 0.01 + Math.sin(state.clock.elapsedTime * 8) * 0.008;
    }
  });

  return (
    <group ref={groupRef} renderOrder={28}>
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[1.65, 1, 1.1]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color={coreColor} depthWrite={false} />
      </mesh>
      <mesh
        ref={innerRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
        scale={[1.15, 1, 0.75]}
      >
        <circleGeometry args={[0.11, 24]} />
        <meshBasicMaterial color={innerColor} transparent opacity={0.9} depthWrite={false} />
      </mesh>
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

/** Blue start pin at the beginning of the route. */
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
    const s = 1 + Math.sin(state.clock.elapsedTime * 3.2) * 0.16;
    pulseRef.current.scale.set(s, s, 1);
  });

  return (
    <group position={[position[0], MARKER_Y, position[2]]} renderOrder={30}>
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.38, 0.54, 32]} />
        <meshBasicMaterial color={NAV_BLUE_GLOW} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color={NAV_BLUE} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.14, 32]} />
        <meshBasicMaterial color="#ffffff" depthWrite={false} />
      </mesh>
      <Text
        position={[0, 0.58, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.32}
        color="#1e3a8a"
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
        renderOrder={31}
      >
        {label}
      </Text>
    </group>
  );
}

/** Static oval at kiosk / start position (preview without full route). */
export function PersonMarker({ position }: { position: [number, number, number] }) {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!glowRef.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.1;
    glowRef.current.scale.set(s * 1.7, s * 1.15, 1);
  });

  return (
    <group position={[position[0], MARKER_Y, position[2]]} renderOrder={28}>
      <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color={NAV_BLUE_GLOW} transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} scale={[1.65, 1, 1.1]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color={NAV_BLUE} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function DestinationCallout({
  position,
  label,
}: {
  position: [number, number, number];
  label: string;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);
  const dotRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pulseRef.current) {
      const s = 1 + Math.sin(t * 3.2) * 0.18;
      pulseRef.current.scale.set(s, s, 1);
    }
    if (dotRef.current) {
      dotRef.current.position.y = 0.04 + Math.sin(t * 4) * 0.02;
    }
  });

  return (
    <group position={[position[0], MARKER_Y, position[2]]} renderOrder={30}>
      <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.42, 0.58, 32]} />
        <meshBasicMaterial color="#facc15" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.42, 32]} />
        <meshBasicMaterial color="#eab308" depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.16, 32]} />
        <meshBasicMaterial color="#ffffff" depthWrite={false} />
      </mesh>
      <mesh ref={dotRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.07, 16]} />
        <meshBasicMaterial color="#ca8a04" depthWrite={false} />
      </mesh>
      <Text
        position={[0, 0.62, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.36}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        maxWidth={5}
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
  animated,
  showMovingMarker = true,
  variant = "blue",
}: {
  points: [number, number, number][];
  progress: number;
  progressRef?: RefObject<number>;
  animated: boolean;
  showMovingMarker?: boolean;
  variant?: "blue" | "mall";
}) {
  const curve = useMemo(() => buildRouteCurve(points), [points]);

  if (!curve) return null;

  return (
    <group renderOrder={15}>
      <FlatRoutePath curve={curve} variant={variant} />

      {showMovingMarker && (
        <NavigationOvalMarker
          curve={curve}
          progress={progress}
          progressRef={progressRef}
          animated={animated}
          variant={variant}
        />
      )}
    </group>
  );
}

export { HALL_ISO, FLOOR_ISO };
