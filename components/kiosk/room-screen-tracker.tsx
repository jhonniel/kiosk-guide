"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, type RefObject } from "react";
import { Vector3 } from "three";

const world = new Vector3();

export function RoomScreenTracker({
  worldPosition,
  overlayRef,
}: {
  worldPosition: [number, number, number];
  overlayRef: RefObject<HTMLDivElement | null>;
}) {
  const { camera, size, invalidate } = useThree();
  const [x, y, z] = worldPosition;

  // The map only redraws on demand; draw once so the card is placed as soon as it opens.
  useEffect(() => {
    invalidate();
  }, [x, y, z, invalidate]);

  useFrame(() => {
    const el = overlayRef.current;
    if (!el) return;
    world.set(worldPosition[0], worldPosition[1], worldPosition[2]);
    world.project(camera);
    const x = (world.x * 0.5 + 0.5) * size.width;
    const y = (-world.y * 0.5 + 0.5) * size.height;
    const behind = world.z > 1;
    el.style.visibility = behind ? "hidden" : "visible";
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
  });

  return null;
}
