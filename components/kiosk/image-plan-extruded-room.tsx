"use client";

import { memo, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, RoundedBox, Text } from "@react-three/drei";
import {
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  type BufferGeometry,
  type Group,
  type InstancedMesh,
  type Material,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  FLOOR_LAYERS,
  nodeExtrudedColors,
  officeDoorPlan,
} from "@/features/building-directory/navigation/building-3d";
import type { NavNode } from "@/features/building-directory/navigation/types";

function riseDelayFor(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 33 + id.charCodeAt(index)) % 8;
  }
  return hash * 0.012;
}

function smoothStep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Selected office pops taller so it stands out without covering neighbors. */
function SelectGrow({ active, children }: { active: boolean; children: ReactNode }) {
  const group = useRef<Object3D>(null);
  const yScaleRef = useRef(1);
  const introRef = useRef(1);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (active) introRef.current = 0;
    invalidate();
  }, [active, invalidate]);

  useFrame((state, delta) => {
    const mesh = group.current;
    if (!mesh) return;
    let target = 1;
    if (active) {
      introRef.current = Math.min(1, introRef.current + delta * 3.2);
      const t = introRef.current;
      const ease = 1 - Math.pow(1 - Math.min(t, 1), 3);
      const overshoot = t < 1 ? Math.sin(Math.min(t, 1) * Math.PI) * 0.1 : 0;
      target = 1 + 0.28 * ease + overshoot;
      yScaleRef.current += (target - yScaleRef.current) * Math.min(1, delta * 14);
    } else {
      yScaleRef.current += (1 - yScaleRef.current) * Math.min(1, delta * 10);
    }
    const settled = Math.abs(target - yScaleRef.current) < 0.002 && (!active || introRef.current >= 1);
    if (settled) yScaleRef.current = target;
    else state.invalidate();
    // Grow upward only — keep footprint so walls do not overlap neighbors.
    mesh.scale.set(1, yScaleRef.current, 1);
  });

  return <group ref={group}>{children}</group>;
}

/** Walls and furniture ease up into place when a level appears. */
function RiseIn({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  const group = useRef<Object3D>(null);
  const born = useRef(-1);
  const done = useRef(false);
  const lift = 0.22;

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      done.current = true;
      return;
    }
    const mesh = group.current;
    if (!mesh) return;
    mesh.position.y = -lift;
    mesh.scale.setScalar(0.99);
  }, []);

  useFrame((state) => {
    if (done.current) return;
    const mesh = group.current;
    if (!mesh) return;
    if (born.current < 0) born.current = state.clock.elapsedTime;
    const progress = (state.clock.elapsedTime - born.current - delay) / 0.32;
    const eased = smoothStep(progress);
    mesh.position.y = -lift * (1 - eased);
    const scale = 0.99 + 0.01 * eased;
    mesh.scale.setScalar(scale);
    if (progress >= 1) {
      mesh.position.y = 0;
      mesh.scale.setScalar(1);
      done.current = true;
      return;
    }
    state.invalidate();
  });

  return <group ref={group}>{children}</group>;
}

function materialKey(material: MeshStandardMaterial | MeshBasicMaterial) {
  const standard = material instanceof MeshStandardMaterial ? material : null;
  return [
    material.type,
    material.color.getHexString(),
    standard?.emissive.getHexString() ?? "",
    standard?.emissiveIntensity ?? 0,
    standard?.roughness ?? 0,
    standard?.metalness ?? 0,
    material.transparent,
    material.opacity,
    material.side,
    material.depthWrite,
    material.toneMapped,
  ].join("|");
}

/**
 * Static furniture as a handful of meshes instead of one per desk leg.
 * Pieces that share a look are merged into one draw call; the originals stay mounted but hidden.
 */
function MergeStatic({ children }: { children: ReactNode }) {
  const source = useRef<Group>(null);
  const target = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    const root = source.current;
    const out = target.current;
    if (!root || !out) return;
    root.updateWorldMatrix(true, true);
    const toLocal = new Matrix4().copy(root.matrixWorld).invert();
    const buckets = new Map<string, { material: Material; geometries: BufferGeometry[]; meshes: Mesh[] }>();

    root.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh || (mesh as InstancedMesh).isInstancedMesh) return;
      const material = mesh.material;
      if (Array.isArray(material)) return;
      if (!(material instanceof MeshStandardMaterial) && !(material instanceof MeshBasicMaterial)) return;
      if (material.map || (mesh.geometry as { isInstancedBufferGeometry?: boolean }).isInstancedBufferGeometry) return;
      const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      for (const name of Object.keys(geometry.attributes)) {
        if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
      }
      geometry.applyMatrix4(new Matrix4().multiplyMatrices(toLocal, mesh.matrixWorld));
      const key = materialKey(material);
      const bucket = buckets.get(key) ?? { material, geometries: [], meshes: [] };
      bucket.geometries.push(geometry);
      bucket.meshes.push(mesh);
      buckets.set(key, bucket);
    });

    const merged: Mesh[] = [];
    const hidden: Mesh[] = [];
    for (const bucket of buckets.values()) {
      const geometry = bucket.meshes.length > 1 ? mergeGeometries(bucket.geometries) : null;
      bucket.geometries.forEach((piece) => piece.dispose());
      if (!geometry) continue;
      const mesh = new Mesh(geometry, bucket.material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      out.add(mesh);
      merged.push(mesh);
      for (const original of bucket.meshes) {
        original.visible = false;
        hidden.push(original);
      }
    }
    invalidate();

    return () => {
      for (const mesh of merged) {
        out.remove(mesh);
        mesh.geometry.dispose();
      }
      for (const original of hidden) original.visible = true;
    };
  }, [invalidate]);

  return (
    <group>
      <group ref={source}>{children}</group>
      <group ref={target} />
    </group>
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

function mapOfficeName(label: string) {
  if (
    label === "Governor's Office" ||
    label === "Administrator Office" ||
    label === "Congressman Office" ||
    label === "Legal Department" ||
    label === "Accounting Department" ||
    label === "Conference Room" ||
    label === "PDRRMO"
  ) {
    return label;
  }
  if (label === "Comfort Room" || label === "Female Comfort Room" || label === "Male Comfort Room") return label;
  if (label === "Multi-Purpose Hall") return "Multi-Purpose\nHall";
  if (label === "Information Office") return "Information\nOffice";
  if (label === "Sangguniang Panlalawigan Office") return "Sangguniang\nPanlalawigan Office";
  if (label === "Secretariat Office") return "Secretariat\nOffice";
  if (label === "Session Hall") return "Session Hall";
  if (label === "Office of the Vice Governor") return "Office of the\nVice Governor";
  if (label === "Internal Audit Services") return "Internal Audit\nServices";
  if (label === "Provincial Planning Development Department") return "Provincial Planning\nDevelopment Department";
  if (label === "Public Employment Services Office Department") return "Public Employment\nServices Office\nDepartment";
  if (label === "Provincial Engineering Department") return "Provincial Engineering\nDepartment";
  if (label === "Environment and Natural Resources") {
    return "Environment and\nNatural Resources";
  }
  if (label === "Bids and Award Committee Office") {
    return "Bids and Award\nCommittee Office";
  }
  return label
    .replace(/^Provincial\s+/i, "")
    .replace(/\s+Ground Floor$/i, "")
    .replace(/\s+Office$/i, "")
    .replace(/\s+and\s+/i, "\nand ");
}

/** Door faces the central corridor. */
function corridorDoorSide(node: NavNode): "north" | "south" | "west" | "east" {
  if (node.x < 160 && node.y > 200 && node.y < 320) return "east";
  if (node.y > 340) return "north";
  if (node.y < 250) return "south";
  return "west";
}

function OfficeWindow({
  args,
  position,
}: {
  args: [number, number, number];
  position: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#8ea4b8" emissive="#64748b" emissiveIntensity={0.18} roughness={0.18} metalness={0.22} />
    </mesh>
  );
}

function wallPieces(
  span: number,
  along: "x" | "z",
  fixed: number,
  y0: number,
  wallHeight: number,
  thickness: number,
  opening?: { span: number; height: number; offset?: number }
): { position: [number, number, number]; args: [number, number, number] }[] {
  const piece = (alongPos: number, y: number, alongSize: number, height: number) =>
    along === "x"
      ? {
          position: [alongPos, y, fixed] as [number, number, number],
          args: [alongSize, height, thickness] as [number, number, number],
        }
      : {
          position: [fixed, y, alongPos] as [number, number, number],
          args: [thickness, height, alongSize] as [number, number, number],
        };

  const wallY = y0 + wallHeight / 2;
  if (!opening || opening.span >= span - 0.2 || opening.height >= wallHeight - 0.04) {
    return [piece(0, wallY, span, wallHeight)];
  }

  const limit = (span - opening.span) / 2 - 0.05;
  const center = Math.min(Math.max(opening.offset ?? 0, -limit), limit);
  const leftEnd = center - opening.span / 2;
  const rightStart = center + opening.span / 2;
  const leftLen = leftEnd + span / 2;
  const rightLen = span / 2 - rightStart;
  const headerH = wallHeight - opening.height;
  return [
    piece(-span / 2 + leftLen / 2, wallY, leftLen, wallHeight),
    piece(rightStart + rightLen / 2, wallY, rightLen, wallHeight),
    piece(center, y0 + opening.height + headerH / 2, opening.span, headerH),
  ];
}

function OpenRoomWalls({
  w,
  h,
  d,
  y0,
  color,
  emissive,
  emissiveIntensity,
  doorSide,
  doorW = 0,
  doorH = 0,
  doorOffset = 0,
  omit,
}: {
  w: number;
  h: number;
  d: number;
  y0: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  doorSide?: "north" | "south" | "west" | "east";
  doorW?: number;
  doorH?: number;
  doorOffset?: number;
  omit?: Array<"north" | "south" | "west" | "east">;
}) {
  const thickness = 0.08;
  const innerDepth = Math.max(d - thickness * 2, 0.2);
  const opening =
    doorSide && doorW > 0.3 && doorH > 0.3
      ? { span: doorW, height: doorH, offset: doorOffset }
      : undefined;
  const faces: { side: "north" | "south" | "west" | "east"; span: number; along: "x" | "z"; fixed: number }[] = [
    { side: "north", span: w, along: "x", fixed: -(d / 2 - thickness / 2) },
    { side: "south", span: w, along: "x", fixed: d / 2 - thickness / 2 },
    { side: "east", span: innerDepth, along: "z", fixed: w / 2 - thickness / 2 },
    { side: "west", span: innerDepth, along: "z", fixed: -(w / 2 - thickness / 2) },
  ];
  const walls = faces
    .filter((face) => !omit?.includes(face.side))
    .flatMap((face) =>
      wallPieces(face.span, face.along, face.fixed, y0, h, thickness, face.side === doorSide ? opening : undefined)
    );

  return (
    <group>
      {walls.map((wall) => (
        <mesh key={wall.position.join(",")} position={wall.position} castShadow receiveShadow>
          <boxGeometry args={wall.args} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={0.78} metalness={0.02} />
        </mesh>
      ))}
    </group>
  );
}

/** Double glass door in the corridor wall. It is the office entrance and exit. */
function GlassOfficeDoor({
  side,
  w,
  d,
  y0,
  doorW,
  doorH,
  offset = 0,
}: {
  side: "north" | "south" | "west" | "east";
  w: number;
  d: number;
  y0: number;
  doorW: number;
  doorH: number;
  offset?: number;
}) {
  const alongX = side === "north" || side === "south";
  const face =
    side === "south" ? d / 2 : side === "north" ? -d / 2 : side === "east" ? w / 2 : -w / 2;
  const doorY = y0 + doorH / 2;
  const frame = 0.055;
  const frameDepth = 0.07;
  const leaf = Math.max((doorW - frame * 3) / 2, 0.2);
  const place = (along: number, y: number): [number, number, number] =>
    alongX ? [along + offset, y, face] : [face, y, along + offset];
  const box = (alongSize: number, height: number, depth: number): [number, number, number] =>
    alongX ? [alongSize, height, depth] : [depth, height, alongSize];
  const framePieces: { key: string; position: [number, number, number]; args: [number, number, number] }[] = [
    { key: "jamb-l", position: place(-doorW / 2 + frame / 2, doorY), args: box(frame, doorH, frameDepth) },
    { key: "jamb-r", position: place(doorW / 2 - frame / 2, doorY), args: box(frame, doorH, frameDepth) },
    { key: "head", position: place(0, y0 + doorH - frame / 2), args: box(doorW, frame, frameDepth) },
    { key: "mullion", position: place(0, doorY), args: box(frame, doorH, frameDepth) },
  ];

  return (
    <group>
      {framePieces.map((piece) => (
        <mesh key={piece.key} position={piece.position} castShadow>
          <boxGeometry args={piece.args} />
          <meshStandardMaterial color="#334155" metalness={0.55} roughness={0.32} />
        </mesh>
      ))}
      {[-doorW / 4, doorW / 4].map((along) => (
        <mesh key={along} position={place(along, doorY)}>
          <boxGeometry args={box(leaf, doorH - frame * 2, 0.02)} />
          <meshStandardMaterial
            color="#dbeafe"
            emissive="#60a5fa"
            emissiveIntensity={0.35}
            transparent
            opacity={0.62}
            roughness={0.06}
            metalness={0.25}
          />
        </mesh>
      ))}
      {[-0.09, 0.09].map((along) => (
        <mesh key={`handle-${along}`} position={place(along, y0 + doorH * 0.46)}>
          <boxGeometry args={box(0.04, 0.14, frameDepth + 0.03)} />
          <meshStandardMaterial color="#f8fafc" metalness={0.65} roughness={0.22} />
        </mesh>
      ))}
    </group>
  );
}

/** Desk and chairs, scaled to the room and kept clear of the walls. */
function OfficeChair() {
  const fabric = "#1e3a5f";
  const metal = "#64748b";
  return (
    <group>
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.04, 10]} />
        <meshStandardMaterial color={metal} metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.26, 8]} />
        <meshStandardMaterial color={metal} metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.32, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.07, 0.38]} />
        <meshStandardMaterial color={fabric} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.54, -0.15]} castShadow>
        <boxGeometry args={[0.38, 0.36, 0.05]} />
        <meshStandardMaterial color={fabric} roughness={0.72} />
      </mesh>
      <mesh position={[-0.18, 0.4, 0.02]}>
        <boxGeometry args={[0.045, 0.04, 0.26]} />
        <meshStandardMaterial color={metal} metalness={0.3} roughness={0.45} />
      </mesh>
      <mesh position={[0.18, 0.4, 0.02]}>
        <boxGeometry args={[0.045, 0.04, 0.26]} />
        <meshStandardMaterial color={metal} metalness={0.3} roughness={0.45} />
      </mesh>
    </group>
  );
}

function OfficeFurniture({ w, d, y0 }: { w: number; d: number; y0: number }) {
  const pad = 0.55;
  const usableW = w - pad * 2;
  const usableD = d - pad * 2;
  if (usableW < 1.8 || usableD < 1.8) return null;

  const alongX = usableW >= usableD;
  const long = alongX ? usableW : usableD;
  const cross = alongX ? usableD : usableW;
  const clusters = long > 11 ? 3 : long > 7 ? 2 : 1;
  const slot = long / clusters;
  const tableLen = Math.min(slot * 0.58, 2.8);
  const tableWid = Math.min(cross * 0.36, 1.35);
  if (tableLen < 1.1 || tableWid < 0.7 || tableWid + 0.9 > cross) return null;

  const topY = y0 + 0.48;
  const legH = 0.44;
  const legT = 0.06;
  const hx = tableLen / 2 - 0.12;
  const hz = tableWid / 2 - 0.1;
  const side = tableWid / 2 + 0.28;
  const chairOffsets = tableLen >= 2 ? [-tableLen * 0.22, tableLen * 0.22] : [0];
  const legs: [number, number][] = [
    [-hx, -hz],
    [hx, -hz],
    [-hx, hz],
    [hx, hz],
  ];

  return (
    <group>
      {Array.from({ length: clusters }, (_, index) => {
        const along = -long / 2 + slot * (index + 0.5);
        const position: [number, number, number] = alongX ? [along, 0, 0] : [0, 0, along];
        return (
          <group key={index} position={position} rotation={[0, alongX ? 0 : Math.PI / 2, 0]}>
            <mesh position={[0, topY, 0]} castShadow receiveShadow>
              <boxGeometry args={[tableLen, 0.06, tableWid]} />
              <meshStandardMaterial color="#c4a574" roughness={0.48} />
            </mesh>
            {legs.map(([x, z]) => (
              <mesh key={`${x},${z}`} position={[x, y0 + legH / 2, z]} castShadow>
                <boxGeometry args={[legT, legH, legT]} />
                <meshStandardMaterial color="#6b4f37" roughness={0.68} />
              </mesh>
            ))}
            {chairOffsets.map((x) => (
              <group key={`near-${x}`} position={[x, y0, -side]}>
                <OfficeChair />
              </group>
            ))}
            {chairOffsets.map((x) => (
              <group key={`far-${x}`} position={[x, y0, side]} rotation={[0, Math.PI, 0]}>
                <OfficeChair />
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/**
 * OfficeChair mesh faces +Z (backrest toward −Z).
 * These yaws aim that look vector in world space.
 */
const LOOK = {
  north: Math.PI, // look −Z
  south: 0, // look +Z
  west: -Math.PI / 2, // look −X
  east: Math.PI / 2, // look +X
} as const;

/**
 * Pedestal office desk + chair.
 * Local +Z = sit facing. Chair on −Z looks +Z at the monitor.
 */
function DeskStation({
  y0,
  x,
  z,
  lookYaw,
  deskLen = 1.35,
  deskDepth = 0.72,
  role = "cubicle",
}: {
  y0: number;
  x: number;
  z: number;
  lookYaw: number;
  deskLen?: number;
  deskDepth?: number;
  role?: "cubicle" | "manager";
}) {
  const isMgr = role === "manager";
  const topThick = 0.055;
  const topY = y0 + 0.72;
  const underY = topY - topThick / 2;
  const pedW = Math.min(0.42, deskLen * 0.32);
  const pedD = deskDepth - 0.08;
  const pedH = underY - y0 - 0.02;
  const wood = isMgr ? "#9a7340" : "#c4a574";
  const woodDark = isMgr ? "#6b4423" : "#8b6914";
  const metal = "#475569";
  const panel = "#5b6b7c";
  const seatZ = -(deskDepth / 2 + 0.38);
  const monZ = deskDepth * 0.22;
  const screenH = isMgr ? 0.34 : 0.3;
  const screenW = isMgr ? 0.52 : 0.44;

  return (
    <group position={[x, 0, z]} rotation={[0, lookYaw, 0]}>
      {/* Desktop */}
      <mesh position={[0, topY, 0]} castShadow receiveShadow>
        <boxGeometry args={[deskLen, topThick, deskDepth]} />
        <meshStandardMaterial color={wood} roughness={0.45} />
      </mesh>
      {/* Front edge lip */}
      <mesh position={[0, topY - 0.01, -deskDepth / 2 + 0.015]}>
        <boxGeometry args={[deskLen, 0.03, 0.03]} />
        <meshStandardMaterial color={woodDark} roughness={0.5} />
      </mesh>

      {/* Left pedestal (drawers) */}
      <mesh position={[-(deskLen / 2 - pedW / 2 - 0.04), y0 + pedH / 2 + 0.02, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[pedW, pedH, pedD]} />
        <meshStandardMaterial color={woodDark} roughness={0.55} />
      </mesh>
      {[0.28, 0.5, 0.72].map((t) => (
        <mesh
          key={t}
          position={[-(deskLen / 2 - pedW / 2 - 0.04), y0 + pedH * t, -pedD / 2 + 0.02]}
        >
          <boxGeometry args={[pedW - 0.06, 0.02, 0.02]} />
          <meshStandardMaterial color={metal} metalness={0.45} roughness={0.35} />
        </mesh>
      ))}

      {/* Right support / second pedestal for manager */}
      {isMgr ? (
        <mesh position={[deskLen / 2 - pedW / 2 - 0.04, y0 + pedH / 2 + 0.02, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[pedW, pedH, pedD]} />
          <meshStandardMaterial color={woodDark} roughness={0.55} />
        </mesh>
      ) : (
        <mesh
          position={[deskLen / 2 - 0.07, y0 + pedH / 2 + 0.02, 0]}
          castShadow
        >
          <boxGeometry args={[0.08, pedH, pedD * 0.85]} />
          <meshStandardMaterial color={woodDark} roughness={0.6} />
        </mesh>
      )}

      {/* Modesty panel (knee-side) */}
      <mesh position={[0, y0 + pedH * 0.42, -deskDepth / 2 + 0.025]} castShadow>
        <boxGeometry args={[deskLen - pedW - 0.2, pedH * 0.72, 0.03]} />
        <meshStandardMaterial color={woodDark} roughness={0.58} />
      </mesh>

      {/* Privacy screen on the far edge of the desk (toward aisle) */}
      <mesh position={[0, topY + (isMgr ? 0.28 : 0.38), deskDepth / 2 - 0.02]} castShadow receiveShadow>
        <boxGeometry args={[deskLen + 0.04, isMgr ? 0.5 : 0.7, 0.035]} />
        <meshStandardMaterial color={panel} roughness={0.82} />
      </mesh>
      <mesh position={[0, topY + (isMgr ? 0.52 : 0.72), deskDepth / 2 - 0.02]}>
        <boxGeometry args={[deskLen + 0.04, 0.03, 0.04]} />
        <meshStandardMaterial color={metal} metalness={0.25} roughness={0.4} />
      </mesh>
      {!isMgr
        ? ([-1, 1] as const).map((side) => (
            <mesh
              key={side}
              position={[side * (deskLen / 2 + 0.01), topY + 0.28, deskDepth * 0.12]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[0.035, 0.55, deskDepth * 0.55]} />
              <meshStandardMaterial color={panel} roughness={0.82} />
            </mesh>
          ))
        : null}

      {/* Monitor facing the chair (−Z) */}
      <mesh position={[0, topY + 0.04, monZ]} castShadow>
        <boxGeometry args={[0.16, 0.04, 0.12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, topY + 0.14, monZ]} castShadow>
        <boxGeometry args={[0.035, 0.16, 0.035]} />
        <meshStandardMaterial color="#334155" metalness={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0, topY + 0.14 + screenH / 2, monZ]} castShadow>
        <boxGeometry args={[screenW, screenH, 0.04]} />
        <meshStandardMaterial color="#0f172a" roughness={0.28} metalness={0.3} />
      </mesh>
      <mesh position={[0, topY + 0.14 + screenH / 2, monZ - 0.022]}>
        <boxGeometry args={[screenW - 0.04, screenH - 0.04, 0.01]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={0.4}
          roughness={0.18}
        />
      </mesh>

      {/* Keyboard + mouse pad */}
      <mesh position={[0, topY + topThick / 2 + 0.008, -deskDepth * 0.12]}>
        <boxGeometry args={[0.42, 0.015, 0.16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[0.32, topY + topThick / 2 + 0.006, -deskDepth * 0.08]}>
        <boxGeometry args={[0.14, 0.01, 0.18]} />
        <meshStandardMaterial color="#334155" roughness={0.65} />
      </mesh>

      {/* CPU tower under open side */}
      {!isMgr ? (
        <mesh position={[deskLen / 2 - 0.22, y0 + 0.28, deskDepth * 0.05]} castShadow>
          <boxGeometry args={[0.18, 0.52, 0.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.2} />
        </mesh>
      ) : null}

      <group position={[0, y0, seatZ]}>
        <OfficeChair />
      </group>
    </group>
  );
}

function FileCabinet({
  y0,
  x,
  z,
  yaw = 0,
}: {
  y0: number;
  x: number;
  z: number;
  yaw?: number;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, y0 + 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 1.1, 0.4]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.18} />
      </mesh>
      <mesh position={[0, y0 + 1.12, 0]}>
        <boxGeometry args={[0.54, 0.04, 0.42]} />
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.25} />
      </mesh>
      {[-0.2, 0.2].map((dx) => (
        <mesh key={dx} position={[dx, y0 + 0.55, 0.21]}>
          <boxGeometry args={[0.035, 0.12, 0.025]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.55} roughness={0.28} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * CPMC open-office: clear door → center aisle → wall desks facing in → manager far wall.
 */
function CubicleOfficeLayout({
  w,
  d,
  y0,
  doorSide,
}: {
  w: number;
  d: number;
  y0: number;
  doorSide: "north" | "south" | "west" | "east";
}) {
  const alongAxis = doorSide === "west" || doorSide === "east" ? ("x" as const) : ("z" as const);
  const long = alongAxis === "x" ? w : d;
  const cross = alongAxis === "x" ? d : w;
  const fromNeg = doorSide === "west" || doorSide === "north";
  const dir = fromNeg ? 1 : -1;

  const deskLen = 1.35;
  const deskDepth = 0.72;
  const doorClear = 2.2;
  const mgrDepth = 0.8;
  // Chair sits behind desk toward the wall; keep desk off the plaster.
  const wallAcross = cross / 2 - (deskDepth / 2 + 0.95);

  if (long < 5 || cross < 5 || wallAcross < 0.8) {
    return <OfficeFurniture w={w} d={d} y0={y0} />;
  }

  const doorEdge = fromNeg ? -long / 2 : long / 2;
  const farEdge = -doorEdge;
  const workStart = doorEdge + dir * doorClear;
  const workEnd = farEdge - dir * (mgrDepth + 1.7);
  const workSpan = Math.abs(workEnd - workStart);
  const colGap = deskLen + 0.45;
  const cols = workSpan >= colGap + deskLen ? 2 : 1;
  const workMid = (workStart + workEnd) / 2;
  const staffAlong =
    cols === 2
      ? [workMid - dir * (colGap / 2), workMid + dir * (colGap / 2)]
      : [workMid];

  const toXZ = (along: number, across: number) =>
    alongAxis === "x" ? { x: along, z: across } : { x: across, z: along };

  // Sit with back to the side wall, facing the center aisle.
  const lookA = alongAxis === "x" ? LOOK.south : LOOK.east;
  const lookB = alongAxis === "x" ? LOOK.north : LOOK.west;
  const lookMgr =
    doorSide === "west"
      ? LOOK.west
      : doorSide === "east"
        ? LOOK.east
        : doorSide === "north"
          ? LOOK.north
          : LOOK.south;
  const lookGuest =
    doorSide === "west"
      ? LOOK.east
      : doorSide === "east"
        ? LOOK.west
        : doorSide === "north"
          ? LOOK.south
          : LOOK.north;

  const mgrAlong = farEdge - dir * (0.7 + mgrDepth / 2);
  const mgr = toXZ(mgrAlong, 0);
  const guest = toXZ(mgrAlong - dir * 1.25, 0);
  const cabAlong = farEdge - dir * 0.48;
  const cabA = toXZ(cabAlong, -(cross / 2 - 0.48));
  const cabB = toXZ(cabAlong, cross / 2 - 0.48);

  return (
    <group>
      {staffAlong.map((along, i) => {
        const a = toXZ(along, -wallAcross);
        const b = toXZ(along, wallAcross);
        return (
          <group key={`pair-${i}`}>
            <DeskStation
              y0={y0}
              x={a.x}
              z={a.z}
              lookYaw={lookA}
              deskLen={deskLen}
              deskDepth={deskDepth}
            />
            <DeskStation
              y0={y0}
              x={b.x}
              z={b.z}
              lookYaw={lookB}
              deskLen={deskLen}
              deskDepth={deskDepth}
            />
          </group>
        );
      })}

      <DeskStation
        y0={y0}
        x={mgr.x}
        z={mgr.z}
        lookYaw={lookMgr}
        deskLen={1.65}
        deskDepth={mgrDepth}
        role="manager"
      />
      <group position={[guest.x, y0, guest.z]} rotation={[0, lookGuest, 0]}>
        <OfficeChair />
      </group>

      <FileCabinet y0={y0} x={cabA.x} z={cabA.z} yaw={lookMgr} />
      <FileCabinet y0={y0} x={cabB.x} z={cabB.z} yaw={lookMgr} />
    </group>
  );
}

type ChairPart = {
  position: [number, number, number];
  args: [number, number, number];
  shape: "box" | "cylinder";
  color: string;
  metal?: boolean;
};

function chairSeats(w: number, d: number, stageX: number, stageD: number): [number, number][] {
  const front = stageX + stageD / 2 + 2.85;
  const rowGap = 1.02;
  const seatGap = 0.82;
  const back = w / 2 - 0.9;
  const rows = Math.max(1, Math.floor((back - front) / rowGap) + 1);
  const span = Math.max(d - 1.6, 2);
  const aisle = 0.7;
  const perSide = Math.max(2, Math.floor((span / 2 - aisle / 2) / seatGap));
  const seats: [number, number][] = [];
  for (let row = 0; row < rows; row++) {
    const x = front + row * rowGap;
    if (x > back) break;
    for (let seat = 0; seat < perSide; seat++) {
      const z = aisle / 2 + seatGap / 2 + seat * seatGap;
      seats.push([x, -z], [x, z]);
    }
  }
  return seats;
}

function InstancedChairPart({ seats, part, y0 }: { seats: [number, number][]; part: ChairPart; y0: number }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const [lx, ly, lz] = part.position;
    seats.forEach(([x, z], index) => {
      bookDummy.position.set(x - lz, y0 + ly, z + lx);
      bookDummy.rotation.set(0, -Math.PI / 2, 0);
      bookDummy.scale.set(1, 1, 1);
      bookDummy.updateMatrix();
      mesh.setMatrixAt(index, bookDummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [seats, part, y0]);

  if (seats.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, seats.length]}>
      {part.shape === "cylinder" ? (
        <cylinderGeometry args={[part.args[0], part.args[1], part.args[2], 8]} />
      ) : (
        <boxGeometry args={part.args} />
      )}
      <meshStandardMaterial
        color={part.color}
        metalness={part.metal ? 0.4 : 0}
        roughness={part.metal ? 0.4 : 0.72}
      />
    </instancedMesh>
  );
}

/** Raised stage on the top end of the hall, with a podium facing the room. */
function HallStage({ w, d, y0 }: { w: number; d: number; y0: number }) {
  const stageD = Math.min(3.1, Math.max(2.2, w * 0.16));
  const stageW = Math.max(d - 0.7, 2);
  const stageH = 0.26;
  const x = -w / 2 + stageD / 2 + 0.2;
  const deckY = y0 + stageH;

  return (
    <group>
      <mesh position={[x, y0 + stageH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[stageD, stageH, stageW]} />
        <meshStandardMaterial color="#8a5a2b" roughness={0.72} />
      </mesh>
      <mesh position={[x, deckY + 0.02, 0]} receiveShadow>
        <boxGeometry args={[stageD + 0.04, 0.04, stageW + 0.04]} />
        <meshStandardMaterial color="#c4a574" roughness={0.5} />
      </mesh>
      <mesh position={[x + stageD / 2 + 0.28, y0 + 0.08, 0]}>
        <boxGeometry args={[0.5, 0.16, Math.min(stageW * 0.42, 8)]} />
        <meshStandardMaterial color="#6b4423" roughness={0.7} />
      </mesh>
      <group position={[x + stageD * 0.08, deckY, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.85, 0.84, 0.55]} />
          <meshStandardMaterial color="#5c3a1e" roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.86, 0.08]} rotation={[-0.38, 0, 0]} castShadow>
          <boxGeometry args={[0.92, 0.06, 0.5]} />
          <meshStandardMaterial color="#d6c4a8" roughness={0.45} />
        </mesh>
        <mesh position={[0, 1.05, -0.04]}>
          <cylinderGeometry args={[0.025, 0.025, 0.28, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.55} roughness={0.3} />
        </mesh>
      </group>
      {(() => {
        const seats = chairSeats(w, d, x, stageD);
        const wood = "#6b3f24";
        const cushion = "#9f1239";
        const parts: ChairPart[] = [
          { position: [-0.15, 0.16, 0.14], args: [0.04, 0.32, 0.04], shape: "box", color: wood },
          { position: [0.15, 0.16, 0.14], args: [0.04, 0.32, 0.04], shape: "box", color: wood },
          { position: [-0.15, 0.38, -0.15], args: [0.04, 0.76, 0.04], shape: "box", color: wood },
          { position: [0.15, 0.38, -0.15], args: [0.04, 0.76, 0.04], shape: "box", color: wood },
          { position: [0, 0.34, 0], args: [0.36, 0.06, 0.36], shape: "box", color: cushion },
          { position: [0, 0.58, -0.15], args: [0.3, 0.34, 0.045], shape: "box", color: cushion },
        ];
        return parts.map((part) => (
          <InstancedChairPart key={`${part.color}-${part.position.join(",")}`} seats={seats} part={part} y0={y0} />
        ));
      })()}
    </group>
  );
}

const BOOK_COLORS = [
  "#b91c1c",
  "#1d4ed8",
  "#15803d",
  "#c2410c",
  "#6d28d9",
  "#0f766e",
  "#a16207",
  "#1e293b",
  "#be123c",
  "#0369a1",
  "#854d0e",
  "#4338ca",
];

const bookDummy = new Object3D();

type ShelfFrame = { position: [number, number, number]; args: [number, number, number]; color: string };
type ShelfBook = { position: [number, number, number]; scale: [number, number, number]; color: string };

/** Parallel shelf rows, same as the first archive layout, with the center left open. */
function archiveLibraryLayout(w: number, d: number, y0: number): { frames: ShelfFrame[]; books: ShelfBook[] } {
  const pad = 0.9;
  const alongX = w >= d;
  const long = (alongX ? w : d) - pad * 2;
  const cross = (alongX ? d : w) - pad * 2;
  const frames: ShelfFrame[] = [];
  const books: ShelfBook[] = [];
  if (long < 2 || cross < 1.2) return { frames, books };

  const caseDepth = 0.5;
  const aisle = 0.78;
  const rows = Math.max(2, Math.min(6, Math.floor((cross + aisle) / (caseDepth + aisle))));
  const caseCount = Math.max(2, Math.min(4, Math.floor(long / 5.5)));
  const caseGap = 0.32;
  const caseLen = (long - (caseCount - 1) * caseGap) / caseCount;
  const caseH = 0.9;
  const sideT = 0.05;
  const shelfT = 0.03;
  const shelfCount = 4;
  const clearAcross = 2.35;
  const toRoom = (along: number, y: number, across: number): [number, number, number] =>
    alongX ? [along, y, across] : [across, y, along];
  const sizeOf = (along: number, y: number, across: number): [number, number, number] =>
    alongX ? [along, y, across] : [across, y, along];

  const placeCase = (
    pieceCenter: number,
    pieceAcross: number,
    pieceSpan: number,
    face: number,
    row: number,
    index: number
  ) => {
    const topBoardY = y0 + 0.02 + (caseH - 0.06);
    const frameH = topBoardY - shelfT / 2 - y0;
    const frameY = y0 + frameH / 2;
    const uprights = [-pieceSpan / 2 + sideT / 2, pieceSpan / 2 - sideT / 2];
    for (const upright of uprights) {
      frames.push({
        position: toRoom(pieceCenter + upright, frameY, pieceAcross),
        args: sizeOf(sideT, frameH, caseDepth),
        color: "#c4a574",
      });
    }
    frames.push({
      position: toRoom(pieceCenter, frameY, pieceAcross - face * (caseDepth / 2 - 0.012)),
      args: sizeOf(pieceSpan, frameH, 0.024),
      color: "#6b4423",
    });

      for (let shelf = 0; shelf < shelfCount; shelf++) {
        const shelfY = y0 + 0.02 + (shelf / (shelfCount - 1)) * (caseH - 0.06);
        const isTop = shelf === shelfCount - 1;
        frames.push({
          position: toRoom(pieceCenter, shelfY, isTop ? pieceAcross : pieceAcross + face * 0.01),
          args: sizeOf(
            isTop ? pieceSpan : pieceSpan - sideT * 2,
            shelfT,
            isTop ? caseDepth + 0.02 : caseDepth - 0.06
          ),
          color: "#c4a574",
        });
      if (shelf === shelfCount - 1) continue;

      const nextY = y0 + 0.02 + ((shelf + 1) / (shelfCount - 1)) * (caseH - 0.06);
      const bookGap = nextY - shelfY - shelfT;
      const bays: [number, number][] = [
        [-pieceSpan / 2 + sideT + 0.04, pieceSpan / 2 - sideT - 0.04],
      ];
      for (const [start, end] of bays) {
        let cursor = start;
        let bookIndex = 0;
        while (cursor < end - 0.06) {
          const bookW = 0.075 + ((bookIndex * 3 + shelf + row) % 5) * 0.014;
          if (cursor + bookW > end) break;
          const bookH = Math.min(bookGap - 0.012, 0.14 + ((bookIndex * 5 + shelf) % 6) * 0.018);
          const bookD = 0.26 + ((bookIndex + row) % 3) * 0.04;
          books.push({
            position: toRoom(
              pieceCenter + cursor + bookW / 2,
              shelfY + shelfT / 2 + bookH / 2,
              pieceAcross + face * 0.03
            ),
            scale: sizeOf(bookW * 0.9, bookH, bookD),
            color: BOOK_COLORS[(bookIndex + shelf * 2 + row + index) % BOOK_COLORS.length],
          });
          cursor += bookW + 0.012;
          bookIndex++;
        }
      }
    }
  };

  const clones: { center: number; span: number }[] = [];
  let hallwayAcross = 0;

  for (let row = 0; row < rows; row++) {
    const across = -cross / 2 + (cross / rows) * (row + 0.5);
    if (Math.abs(across) - caseDepth / 2 < clearAcross) continue;
    const towardCenter = across > 0 ? -1 : 1;
    for (let index = 0; index < caseCount; index++) {
      const along = -long / 2 + caseLen / 2 + index * (caseLen + caseGap);
      // Hallway cases west of the glass door stay out.
      if (across < 0 && along < 0) continue;
      const besideDoor = across < 0 && along > 0 && along - caseLen / 2 < caseGap + 0.25;
      const shelfBreak = 0.85;
      const span = besideDoor ? caseLen / 2 : caseLen;
      const center = besideDoor ? along + caseLen / 4 + caseGap - shelfBreak : along;

      const splitMiddle = across < 0 && along > 0 && !besideDoor;
      const pieceSpan = splitMiddle ? (caseLen - shelfBreak) / 2 : span;
      const pieces = splitMiddle
        ? [
            { span: pieceSpan, center: along - (shelfBreak + pieceSpan) / 2 },
            { span: pieceSpan, center: along + (shelfBreak + pieceSpan) / 2 },
          ]
        : [{ span, center }];

      for (const piece of pieces) {
        placeCase(piece.center, across, piece.span, towardCenter, row, index);
        if (across < 0 && along > 0) {
          hallwayAcross = across;
          clones.push({ center: piece.center, span: piece.span });
        }
      }
    }
  }

  // Same three shelves through the open floor, and the empty stretch along the top wall.
  const floorRows = [-1.45, 0, 1.45, hallwayAcross];
  for (const rowAcross of floorRows) {
    clones.forEach((piece, index) => {
      if (rowAcross !== hallwayAcross) {
        placeCase(piece.center, rowAcross, piece.span, 1, 3, index);
      }
      placeCase(-piece.center, rowAcross, piece.span, 1, 5, index);
    });
  }

  return { frames, books };
}

function ReadingTable({ y0 }: { y0: number }) {
  const tableLen = 1.85;
  const tableWid = 0.9;
  const topY = y0 + 0.48;
  const legH = 0.44;
  const legT = 0.055;
  const hx = tableLen / 2 - 0.1;
  const hz = tableWid / 2 - 0.08;
  const side = tableWid / 2 + 0.28;
  const legs: [number, number][] = [
    [-hx, -hz],
    [hx, -hz],
    [-hx, hz],
    [hx, hz],
  ];
  const chairXs = [-tableLen * 0.22, tableLen * 0.22];

  return (
    <group>
      <mesh position={[0, topY, 0]} castShadow receiveShadow>
        <boxGeometry args={[tableLen, 0.06, tableWid]} />
        <meshStandardMaterial color="#c4a574" roughness={0.48} />
      </mesh>
      {legs.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, y0 + legH / 2, z]} castShadow>
          <boxGeometry args={[legT, legH, legT]} />
          <meshStandardMaterial color="#6b4f37" roughness={0.68} />
        </mesh>
      ))}
      {chairXs.map((x) => (
        <group key={`near-${x}`} position={[x, y0, -side]}>
          <OfficeChair />
        </group>
      ))}
      {chairXs.map((x) => (
        <group key={`far-${x}`} position={[x, y0, side]} rotation={[0, Math.PI, 0]}>
          <OfficeChair />
        </group>
      ))}
    </group>
  );
}

function ColoredBooks({ books }: { books: ShelfBook[] }) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    books.forEach((book, index) => {
      bookDummy.position.set(book.position[0], book.position[1], book.position[2]);
      bookDummy.scale.set(book.scale[0], book.scale[1], book.scale[2]);
      bookDummy.rotation.set(0, 0, 0);
      bookDummy.updateMatrix();
      mesh.setMatrixAt(index, bookDummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [books]);

  if (books.length === 0) return null;

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, books.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={books[0].color} roughness={0.68} />
    </instancedMesh>
  );
}

function ArchiveLibrary({ w, d, y0 }: { w: number; d: number; y0: number }) {
  const layout = useMemo(() => archiveLibraryLayout(w, d, y0), [w, d, y0]);
  const byColor = useMemo(() => {
    const groups = new Map<string, ShelfBook[]>();
    for (const book of layout.books) {
      const list = groups.get(book.color);
      if (list) list.push(book);
      else groups.set(book.color, [book]);
    }
    return [...groups.entries()];
  }, [layout.books]);
  const alongX = w >= d;
  const tableSlots: [number, number][] = [
    [-1.2, -1.15],
    [1.2, -1.15],
    [-1.2, 1.15],
    [1.2, 1.15],
  ];

  return (
    <group>
      {layout.frames.map((frame, index) => (
        <mesh key={index} position={frame.position}>
          <boxGeometry args={frame.args} />
          <meshStandardMaterial color={frame.color} roughness={0.62} />
        </mesh>
      ))}
      {byColor.map(([color, books]) => (
        <ColoredBooks key={color} books={books} />
      ))}
      {tableSlots.map(([along, across]) => (
        <group
          key={`${along},${across}`}
          position={alongX ? [along, 0, across] : [across, 0, along]}
          rotation={alongX ? [0, 0, 0] : [0, Math.PI / 2, 0]}
        >
          <ReadingTable y0={y0} />
        </group>
      ))}
    </group>
  );
}

function OfficeVolume({
  node,
  offset,
  size,
  highlighted,
  door,
  openTop = false,
  furnish = false,
  onClick,
  riseDelay = 0,
  omitWalls,
  partialWall,
}: {
  node: NavNode;
  offset: [number, number, number];
  size: [number, number, number];
  highlighted?: boolean;
  door: boolean;
  openTop?: boolean;
  furnish?: boolean;
  onClick?: () => void;
  riseDelay?: number;
  omitWalls?: Array<"north" | "south" | "west" | "east">;
  /** East portion of a north or south wall, used where the comfort room steps back. */
  partialWall?: { side: "north" | "south" };
}) {
  const [w, h, d] = size;
  const colors = nodeExtrudedColors(node, !!highlighted);
  const radius = Math.min(0.08, w * 0.04, d * 0.04, h * 0.06);
  const y0 = FLOOR_LAYERS.roomFloorY;
  const wall = highlighted ? colors.body : "#f4efe4";
  const roof = highlighted ? "#fbbf24" : "#e7dcc8";
  const doorPlan = officeDoorPlan(node.locationId);
  const doorSide = doorPlan?.side ?? corridorDoorSide(node);
  const glassH = Math.min(0.26, h * 0.2);
  const glassY = y0 + h * 0.64;
  const glassLift = 0.02;
  const wallSpan = doorSide === "east" || doorSide === "west" ? Math.max(d - 0.16, 0.6) : w;
  const doorW = Math.min(1.45, Math.max(0.85, wallSpan * 0.22), Math.max(wallSpan - 0.4, 0.5));
  const doorOffset = (doorPlan?.along ?? 0) * (doorSide === "east" || doorSide === "west" ? d : w);
  const doorH = Math.min(h * 0.84, h - 0.1);
  const doorY = y0 + doorH / 2 + 0.02;
  const showGlassDoor = openTop && door && furnish;

  return (
    <group position={offset}>
      <RiseIn delay={riseDelay}>
      {openTop ? (
        <>
        <OpenRoomWalls
          w={w}
          h={h}
          d={d}
          y0={y0}
          color={wall}
          emissive={highlighted ? colors.emissive : "#d6cbb8"}
          emissiveIntensity={highlighted ? 0.28 : 0.04}
          doorSide={showGlassDoor ? doorSide : undefined}
          doorW={doorW}
          doorH={doorH}
          doorOffset={doorOffset}
          omit={omitWalls}
        />
        {partialWall ? (
          <mesh
            position={[
              w * 0.291,
              y0 + h / 2,
              (partialWall.side === "south" ? 1 : -1) * (d / 2 - 0.04),
            ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[w * 0.418, h, 0.08]} />
            <meshStandardMaterial
              color={wall}
              emissive={highlighted ? colors.emissive : "#d6cbb8"}
              emissiveIntensity={highlighted ? 0.28 : 0.04}
              roughness={0.78}
              metalness={0.02}
            />
          </mesh>
        ) : null}
        </>
      ) : (
        <RoundedBox
          args={[w, h, d]}
          radius={radius}
          smoothness={3}
          position={[0, y0 + h / 2, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={wall}
            emissive={highlighted ? colors.emissive : "#d6cbb8"}
            emissiveIntensity={highlighted ? 0.28 : 0.04}
            roughness={0.78}
            metalness={0.02}
          />
        </RoundedBox>
      )}
      {openTop ? null : (
        <mesh position={[0, y0 + 0.07, 0]}>
          <boxGeometry args={[w + 0.03, 0.12, d + 0.03]} />
          <meshStandardMaterial color={highlighted ? "#e8b84a" : "#cbbfaa"} roughness={0.86} />
        </mesh>
      )}
      {openTop ? null : (
        <mesh position={[0, y0 + h + 0.025, 0]}>
          <boxGeometry args={[w * 0.94, 0.05, d * 0.94]} />
          <meshStandardMaterial color={roof} roughness={0.7} metalness={0.02} />
        </mesh>
      )}
      {openTop ? null : (
        <>
          <OfficeWindow args={[w * 0.72, glassH, 0.03]} position={[0, glassY, d / 2 + glassLift]} />
          <OfficeWindow args={[w * 0.72, glassH, 0.03]} position={[0, glassY, -(d / 2 + glassLift)]} />
          <OfficeWindow args={[0.03, glassH, d * 0.62]} position={[w / 2 + glassLift, glassY, 0]} />
          <OfficeWindow args={[0.03, glassH, d * 0.62]} position={[-(w / 2 + glassLift), glassY, 0]} />
        </>
      )}
      {showGlassDoor ? (
        <GlassOfficeDoor
          side={doorSide}
          w={w}
          d={d}
          y0={y0}
          doorW={doorW}
          doorH={doorH}
          offset={doorOffset}
        />
      ) : null}
      {openTop || !door ? null : (
        <mesh
          position={
            doorSide === "south"
              ? [0, doorY, d / 2 + 0.03]
              : doorSide === "north"
                ? [0, doorY, -(d / 2 + 0.03)]
                : doorSide === "east"
                  ? [w / 2 + 0.03, doorY, 0]
                  : [-(w / 2 + 0.03), doorY, 0]
          }
        >
          <boxGeometry args={doorSide === "west" || doorSide === "east" ? [0.03, doorH, doorW] : [doorW, doorH, 0.03]} />
          <meshStandardMaterial color={highlighted ? "#9a3412" : "#6f4e37"} roughness={0.62} />
        </mesh>
      )}
      </RiseIn>
      <RiseIn delay={riseDelay + 0.04}>
      {furnish ? (
        <MergeStatic>
          {node.locationId === "f3-archive" || node.label === "Archive" ? (
            <ArchiveLibrary w={w} d={d} y0={y0} />
          ) : node.locationId === "f3-multipurpose" || node.label === "Multi-Purpose Hall" ? (
            <HallStage w={w} d={d} y0={y0} />
          ) : node.locationId === "f3-cpmc" || /\bcpmc\b/i.test(node.label ?? "") ? (
            <CubicleOfficeLayout w={w} d={d} y0={y0} doorSide={doorSide} />
          ) : (
            <OfficeFurniture w={w} d={d} y0={y0} />
          )}
        </MergeStatic>
      ) : null}
      </RiseIn>
      <RoomClickTarget width={w} depth={d} onClick={onClick} />
    </group>
  );
}

/** Office block: plaster walls, roof, window band, and a corridor door. */
function ImagePlanExtrudedRoomView({
  node,
  position,
  size,
  parts,
  highlighted,
  hideLabel = false,
  onClick,
}: {
  node: NavNode;
  position: [number, number, number];
  size: [number, number, number];
  parts?: { position: [number, number, number]; size: [number, number, number]; door: boolean }[];
  highlighted?: boolean;
  hideLabel?: boolean;
  onClick?: () => void;
}) {
  const volumes = parts ?? [{ position: [0, 0, 0] as [number, number, number], size, door: true }];
  const labelHeight = Math.max(...volumes.map((part) => part.size[1]));
  const y0 = FLOOR_LAYERS.roomFloorY;
  const comfortLabel = !!node.label?.endsWith("Comfort Room");
  const riseDelay = riseDelayFor(node.id);

  return (
    <group position={position}>
      <SelectGrow active={!!highlighted}>
      {volumes.map((part, index) => {
        const comfortWall =
          comfortLabel && index === 0
            ? { omitWalls: ["south"] as Array<"north" | "south">, partialWall: { side: "south" as const } }
            : comfortLabel && index === 1
              ? { omitWalls: ["north"] as Array<"north" | "south"> }
              : comfortLabel && index === 2
                ? { omitWalls: ["south"] as Array<"north" | "south"> }
                : comfortLabel && index === 3
                  ? { omitWalls: ["north"] as Array<"north" | "south">, partialWall: { side: "north" as const } }
                  : {};
        return (
          <OfficeVolume
            key={index}
            node={node}
            offset={part.position}
            size={part.size}
            highlighted={highlighted}
            door={part.door}
            openTop
            furnish={!comfortLabel}
            onClick={onClick}
            riseDelay={riseDelay}
            omitWalls={comfortWall.omitWalls}
            partialWall={comfortWall.partialWall}
          />
        );
      })}
      </SelectGrow>
      {comfortLabel && !hideLabel
        ? [
            { part: volumes[0], text: "MALE" },
            { part: volumes[3], text: "FEMALE" },
          ].map(({ part, text }) =>
            part ? (
              <Text
                key={text}
                position={[part.position[0], y0 + 0.1, part.position[2]]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.36}
                color="#1e293b"
                anchorX="center"
                anchorY="middle"
                maxWidth={Math.max(part.size[0] - 0.35, 1.4)}
                renderOrder={20}
                outlineWidth={0.012}
                outlineColor="#ffffff"
              >
                {text}
              </Text>
            ) : null
          )
        : null}
      {!comfortLabel && (node.type === "room" || node.type === "elevator") && node.label && !hideLabel ? (
        <Html
          position={[0, y0 + labelHeight + 0.28, 0]}
          center
          zIndexRange={[30, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="select-none whitespace-pre-line text-center text-[18px] font-extrabold leading-tight tracking-tight text-[#1a2744]"
            style={{
              maxWidth: "11rem",
              textShadow: "0 1px 0 #fff, 0 0 10px rgba(255,255,255,0.98)",
            }}
          >
            {mapOfficeName(node.label)}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

/** Elevator cab filling the plan outline: shaft, framed doors, and a call light. */
function ImagePlanElevatorView({
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
  const [w, , d] = size;
  const h = 1.5;
  const doorSpan = Math.min(d * 0.62, 1.65);
  const doorH = h * 0.7;
  const panelW = doorSpan / 2 - 0.025;
  const faceX = w / 2;
  const doorY = h * 0.4;
  const body = highlighted ? "#fcd34d" : "#e8eef5";
  const frame = highlighted ? "#b45309" : "#334155";

  return (
    <group position={position}>
      <RoundedBox args={[w, h, d]} position={[0, h / 2, 0]} radius={0.05} smoothness={2}>
        <meshStandardMaterial color={body} roughness={0.42} metalness={0.08} />
      </RoundedBox>

      <mesh position={[faceX + 0.01, doorY, 0]}>
        <boxGeometry args={[0.03, doorH + 0.1, doorSpan + 0.12]} />
        <meshBasicMaterial color={frame} toneMapped={false} />
      </mesh>
      <mesh position={[faceX + 0.03, doorY, -(panelW / 2 + 0.012)]}>
        <boxGeometry args={[0.02, doorH, panelW]} />
        <meshBasicMaterial color="#f8fafc" toneMapped={false} />
      </mesh>
      <mesh position={[faceX + 0.03, doorY, panelW / 2 + 0.012]}>
        <boxGeometry args={[0.02, doorH, panelW]} />
        <meshBasicMaterial color="#f8fafc" toneMapped={false} />
      </mesh>
      <mesh position={[faceX + 0.042, doorY, 0]}>
        <boxGeometry args={[0.012, doorH * 0.92, 0.018]} />
        <meshBasicMaterial color="#64748b" toneMapped={false} />
      </mesh>
      <mesh position={[faceX + 0.03, h * 0.86, 0]}>
        <boxGeometry args={[0.02, 0.1, 0.22]} />
        <meshBasicMaterial color="#0f172a" toneMapped={false} />
      </mesh>
      <mesh position={[faceX + 0.042, h * 0.88, 0]}>
        <boxGeometry args={[0.01, 0.035, 0.035]} />
        <meshBasicMaterial color="#22c55e" toneMapped={false} />
      </mesh>

      <RoomClickTarget width={w} depth={d} onClick={onClick} />
    </group>
  );
}

const STAIR_STEPS = 6;

/** Switchback stairs filling the floor-plan stair symbol. */
function ImagePlanStairwellView({
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
  const [w, , d] = size;
  const alongX = node.y < 320;
  const flipped = /stair[-_]b/.test(`${node.id} ${node.locationId ?? ""}`);
  const length = alongX ? w : d;
  const span = alongX ? d : w;
  const flightLen = length * 0.7;
  const landingLen = length * 0.3;
  const flightSpan = span * 0.42;
  const well = Math.max(span - flightSpan * 2, span * 0.12);
  const treadRun = flightLen / STAIR_STEPS;
  const rise = Math.max(0.14, length * 0.045);
  const totalRise = STAIR_STEPS * rise;
  const tread = highlighted ? "#fff7ed" : "#fafaf9";
  const riser = highlighted ? "#d6d3d1" : "#a8a29e";

  const place = (along: number, y: number, across: number): [number, number, number] => {
    const directed = flipped ? -along : along;
    return alongX ? [directed, y, across] : [across, y, directed];
  };

  const box = (along: number, y: number, across: number): [number, number, number] =>
    alongX ? [along, y, across] : [across, y, along];

  const goesUp = node.floor < 3;
  const flights = [-1, 1].flatMap((side) => {
    const across = side * (well / 2 + flightSpan / 2);
    const goingUp = side > 0;
    return Array.from({ length: STAIR_STEPS }, (_, i) => {
      const along = goingUp
        ? -length / 2 + treadRun * (i + 0.5)
        : length / 2 - landingLen - treadRun * (i + 0.5);
      const step = goingUp ? i : STAIR_STEPS - 1 - i;
      return {
        key: `${side}-${i}`,
        along,
        across,
        // Upper floor leaves this level and drops toward the floor below.
        y: goesUp ? rise * (step + 1) : -rise * step,
        i: step,
        goingUp,
      };
    });
  });
  const landingY = goesUp ? totalRise + 0.035 : -totalRise;
  const nextFloorLabel = node.floor === 1 ? "2ND FLOOR" : goesUp ? "3RD FLOOR" : "2ND FLOOR";

  return (
    <group position={position}>
      <mesh
        position={[0, goesUp ? 0.04 : landingY - 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={4}
      >
        <planeGeometry args={[w * 1.08, d * 1.08]} />
        <meshBasicMaterial color="#389e0d" toneMapped={false} />
      </mesh>

      {flights.map((step) => (
        <group key={step.key}>
          <mesh position={place(step.along, step.y - 0.025, step.across)} castShadow receiveShadow>
            <boxGeometry args={box(treadRun * 0.9, 0.05, flightSpan * 0.94)} />
            <meshStandardMaterial color={tread} roughness={0.4} metalness={0.02} />
          </mesh>
          <mesh position={place(step.along + (step.goingUp ? -1 : 1) * treadRun * 0.42, step.y - rise * 0.5, step.across)}>
            <boxGeometry args={box(0.016, rise * 0.9, flightSpan * 0.94)} />
            <meshStandardMaterial color={riser} roughness={0.75} />
          </mesh>
        </group>
      ))}

      <group>
        <mesh position={place(length / 2 - landingLen / 2, landingY, 0)} castShadow receiveShadow>
          <boxGeometry args={box(landingLen * 1.08, 0.07, span * 1.04)} />
          <meshStandardMaterial color="#f4efe4" roughness={0.55} />
        </mesh>
        <mesh position={place(length / 2 - landingLen + 0.02, landingY, 0)}>
          <boxGeometry args={box(0.02, 0.07, span * 1.04)} />
          <meshStandardMaterial color="#d6d3d1" roughness={0.7} />
        </mesh>
        <Text
          position={place(length / 2 - landingLen / 2, landingY + 0.06, 0)}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.16}
          color="#1e293b"
          anchorX="center"
          anchorY="middle"
          renderOrder={8}
        >
          {nextFloorLabel}
        </Text>
      </group>

      <mesh
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={
          onClick
            ? (e) => {
                e.stopPropagation();
                onClick();
              }
            : undefined
        }
        onPointerOver={
          onClick
            ? (e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }
            : undefined
        }
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Compact marker for elevators / restrooms on the floor-plan image. */
function ImagePlanFacilityPinView({
  position,
  highlighted,
  onClick,
}: {
  position: [number, number, number];
  highlighted?: boolean;
  onClick?: () => void;
}) {
  const color = highlighted ? "#f59e0b" : "#64748b";
  const emissive = highlighted ? "#d97706" : "#475569";

  return (
    <group
      position={position}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
      onPointerOver={
        onClick
          ? (e) => {
              e.stopPropagation();
              document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {highlighted && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.55, 0.72, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.55, 0.16, 0.55]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.25} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Freestanding directory kiosk, faced toward the isometric camera. */
export function ImagePlanKiosk({
  position,
  label = "You're Here",
}: {
  position: [number, number, number];
  label?: string;
}) {
  const ringRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const wave = (Math.sin(clock.elapsedTime * 2.6) + 1) / 2;
    const material = ringRef.current.material as MeshBasicMaterial;
    material.opacity = 0.28 + wave * 0.45;
    const scale = 1 + wave * 0.22;
    ringRef.current.scale.set(scale, scale, 1);
  });

  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]} renderOrder={30}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.55, 40]} />
        <meshBasicMaterial color="#dcfce7" transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.48, 0.62, 40]} />
        <meshBasicMaterial color="#16a34a" transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </mesh>

      <RoundedBox args={[0.78, 0.07, 0.52]} position={[0, 0.05, 0]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[0.2, 0.32, 0.16]} position={[0, 0.24, 0]} radius={0.02} smoothness={2}>
        <meshStandardMaterial color="#f8fafc" roughness={0.45} />
      </RoundedBox>

      <group position={[0, 0.64, 0.04]} rotation={[-0.22, 0, 0]}>
        <RoundedBox args={[0.72, 0.5, 0.22]} radius={0.04} smoothness={3}>
          <meshStandardMaterial color="#f8fafc" roughness={0.42} />
        </RoundedBox>
        <mesh position={[0, 0, 0.112]}>
          <planeGeometry args={[0.58, 0.36]} />
          <meshBasicMaterial color="#0f172a" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.116]}>
          <planeGeometry args={[0.5, 0.28]} />
          <meshBasicMaterial color="#16a34a" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.07, 0.118]}>
          <planeGeometry args={[0.34, 0.03]} />
          <meshBasicMaterial color="#ecfdf5" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.01, 0.118]}>
          <planeGeometry args={[0.34, 0.018]} />
          <meshBasicMaterial color="#86efac" toneMapped={false} />
        </mesh>
      </group>

      <Html position={[0, 1.12, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
        <div className="you-are-here-pin">
          <span className="you-are-here-dot" />
          <span>{label}</span>
          <span className="you-are-here-caret" />
        </div>
      </Html>
    </group>
  );
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => sameValue(item, b[index]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return (
      keysA.length === keysB.length &&
      keysA.every((key) => sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
    );
  }
  return false;
}

/**
 * Scene pieces re-render only when what they draw changes.
 * The scene re-renders on every navigation tick; click handlers are rebuilt each time but
 * always forward to the latest handler, so only their presence matters here.
 */
function sameScenePieceProps<P extends { node?: NavNode; onClick?: () => void }>(prev: P, next: P) {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]) as Set<keyof P>;
  for (const key of keys) {
    if (key === "onClick") {
      if (Boolean(prev.onClick) !== Boolean(next.onClick)) return false;
      continue;
    }
    if (key === "node") {
      if (prev.node !== next.node && !sameValue(prev.node, next.node)) return false;
      continue;
    }
    if (!sameValue(prev[key], next[key])) return false;
  }
  return true;
}

export const ImagePlanExtrudedRoom = memo(ImagePlanExtrudedRoomView, sameScenePieceProps);
export const ImagePlanElevator = memo(ImagePlanElevatorView, sameScenePieceProps);
export const ImagePlanStairwell = memo(ImagePlanStairwellView, sameScenePieceProps);
export const ImagePlanFacilityPin = memo(ImagePlanFacilityPinView, sameScenePieceProps);
