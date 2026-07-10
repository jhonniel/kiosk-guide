"use client";

import { useLayoutEffect, useRef } from "react";
import { OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type * as THREE from "three";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import { fitOrthographicZoom, getFloorExtents } from "@/features/building-directory/navigation/building-3d";

interface IsometricNavigationCameraProps {
  graph: NavigationGraph;
  viewFloor: number;
}

export function IsometricNavigationCamera({ graph, viewFloor }: IsometricNavigationCameraProps) {
  const ref = useRef<THREE.OrthographicCamera>(null);
  const { size, invalidate } = useThree();

  useLayoutEffect(() => {
    const cam = ref.current;
    if (!cam) return;

    const { width, depth } = getFloorExtents(graph, viewFloor);

    cam.position.set(22, 34, 22);
    cam.lookAt(0, 0, 0);
    cam.up.set(0, 1, 0);
    fitOrthographicZoom(cam, width, depth, 1.12);
    invalidate();
  }, [graph, viewFloor, size.width, size.height, invalidate]);

  return (
    <OrthographicCamera
      ref={ref}
      makeDefault
      position={[22, 34, 22]}
      near={-80}
      far={200}
    />
  );
}
