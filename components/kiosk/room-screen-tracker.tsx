"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RefObject } from "react";

export function RoomScreenTracker({
  worldPosition,
  overlayRef,
}: {
  worldPosition: [number, number, number];
  overlayRef: RefObject<HTMLDivElement | null>;
}) {
  const { camera, size } = useThree();
  const vec = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const el = overlayRef.current;
    if (!el) return;

    vec.set(worldPosition[0], worldPosition[1], worldPosition[2]);
    vec.project(camera);

    if (vec.z > 1 || vec.z < -1) {
      el.style.visibility = "hidden";
      return;
    }

    const x = (vec.x * 0.5 + 0.5) * size.width;
    const y = (-vec.y * 0.5 + 0.5) * size.height;

    el.style.visibility = "visible";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = "translate(-50%, calc(-100% - 10px))";
  });

  return null;
}
