"use client";

import { RoundedBox } from "@react-three/drei";
import { FLOOR_LAYERS, nodeExtrudedColors } from "@/features/building-directory/navigation/building-3d";
import type { NavNode } from "@/features/building-directory/navigation/types";

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

/** Mall-style extruded block aligned to a floor-plan office pin. */
export function ImagePlanExtrudedRoom({
  node,
  position,
  size,
  highlighted,
  onClick,
}: {
  node: NavNode;
  position: [number, number, number];
  size: [number, number, number];
  highlighted?: boolean;
  onClick?: () => void;
}) {
  const [w, h, d] = size;
  const colors = nodeExtrudedColors(node, !!highlighted);
  const radius = Math.min(0.12, w * 0.08, d * 0.08, h * 0.08);

  return (
    <group position={position}>
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
          emissiveIntensity={highlighted ? 0.35 : 0.08}
          roughness={0.48}
          metalness={0.04}
        />
      </RoundedBox>
      {highlighted && (
        <mesh position={[0, FLOOR_LAYERS.roomFloorY + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) * 0.42, Math.max(w, d) * 0.58, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      )}
      <RoomClickTarget width={w} depth={d} onClick={onClick} />
    </group>
  );
}

/** Blue map-pin for kiosk / you-are-here (mall wayfinding style). */
export function ImagePlanLocationPin({ position }: { position: [number, number, number] }) {
  return (
    <group position={[position[0], 0, position[2]]} renderOrder={30}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.42, 0.58, 32]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.38, 32]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.36, 12]} />
        <meshStandardMaterial color="#1e40af" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#1d4ed8"
          emissiveIntensity={0.45}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}
